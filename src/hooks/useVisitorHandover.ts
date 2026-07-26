"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAiSocketEvent } from "@/hooks/useAiSocket";
import type {
  HandoverContactDeclinedPayload,
  HandoverContactSavedPayload,
  HandoverRequestedPayload,
  VisitorHandoverState,
} from "@/types/humanHandover";
import {
  declineHandoverContact,
  submitHandoverContact,
} from "@/utils/humanHandoverApi";
import { extractHumanHandoverApiError } from "@/utils/humanHandoverFormUtils";
import {
  applyHandoverRequestedPayload,
  createInitialVisitorHandoverState,
  DEFAULT_CONTACT_SAVED_MESSAGE,
  isHandoverSessionEvent,
  validateHandoverContactInput,
} from "@/utils/humanHandoverVisitorUtils";

interface UseVisitorHandoverOptions {
  agentId: string;
  chatSessionId: string;
  emit: (event: string, payload?: unknown) => void;
  socketConnected: boolean;
  initialState?: VisitorHandoverState | null;
}

export function useVisitorHandover({
  agentId,
  chatSessionId,
  emit,
  socketConnected,
  initialState,
}: UseVisitorHandoverOptions) {
  const [handover, setHandover] = useState<VisitorHandoverState>(
    initialState ?? createInitialVisitorHandoverState(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    if (!initialState) return;
    setHandover((prev) => (prev.isActive ? prev : initialState));
  }, [initialState]);

  useEffect(() => {
    setHandover(createInitialVisitorHandoverState());
    setIsSubmitting(false);
    setIsDeclining(false);
  }, [agentId, chatSessionId]);

  const handleHandoverRequested = useCallback(
    (payload: HandoverRequestedPayload) => {
      if (!isHandoverSessionEvent(payload, agentId, chatSessionId)) return;
      setHandover(applyHandoverRequestedPayload(payload));
    },
    [agentId, chatSessionId],
  );

  const handleHandoverContactSaved = useCallback(
    (payload: HandoverContactSavedPayload) => {
      if (!isHandoverSessionEvent(payload, agentId, chatSessionId)) return;
      setHandover((prev) => ({
        ...prev,
        isActive: true,
        showContactForm: false,
        contactStatus: payload.contact_status ?? "provided",
        contactSavedMessage:
          payload.message?.trim() || DEFAULT_CONTACT_SAVED_MESSAGE,
      }));
      setIsSubmitting(false);
    },
    [agentId, chatSessionId],
  );

  const handleHandoverContactDeclined = useCallback(
    (payload: HandoverContactDeclinedPayload) => {
      if (!isHandoverSessionEvent(payload, agentId, chatSessionId)) return;
      setHandover((prev) => ({
        ...prev,
        isActive: true,
        showContactForm: false,
        contactStatus: payload.contact_status ?? "declined",
      }));
      setIsDeclining(false);
    },
    [agentId, chatSessionId],
  );

  useAiSocketEvent("handover_requested", handleHandoverRequested);
  useAiSocketEvent("handover_contact_saved", handleHandoverContactSaved);
  useAiSocketEvent("handover_contact_declined", handleHandoverContactDeclined);

  useAiSocketEvent<{ agent_id?: string; chat_session_id?: string }>(
    "conversation_started",
    (payload) => {
      if (!isHandoverSessionEvent(payload, agentId, chatSessionId)) return;
      setHandover(createInitialVisitorHandoverState());
      setIsSubmitting(false);
      setIsDeclining(false);
    },
  );

  useEffect(() => {
    if (!isSubmitting && !isDeclining) return;

    const timeout = window.setTimeout(() => {
      setIsSubmitting(false);
      setIsDeclining(false);
    }, 15000);

    return () => window.clearTimeout(timeout);
  }, [isSubmitting, isDeclining]);

  const submitContact = useCallback(
    async (name: string, email: string) => {
      if (!agentId || !chatSessionId || isSubmitting) return;

      const validationError = validateHandoverContactInput(name, email);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const payload = {
        agent_id: agentId,
        chat_session_id: chatSessionId,
        name: name.trim(),
        email: email.trim(),
      };

      setIsSubmitting(true);

      if (socketConnected) {
        emit("atlas-visitor-handover-contact", payload);
        return;
      }

      try {
        const response = await submitHandoverContact(payload);
        if (!response.success) {
          toast.error(response.message || "Unable to save your details.");
          setIsSubmitting(false);
          return;
        }

        setHandover((prev) => ({
          ...prev,
          isActive: true,
          showContactForm: false,
          contactStatus: "provided",
          contactSavedMessage:
            response.message?.trim() || DEFAULT_CONTACT_SAVED_MESSAGE,
        }));
        setIsSubmitting(false);
      } catch (error: unknown) {
        toast.error(
          extractHumanHandoverApiError(error, "Unable to save your details."),
        );
        setIsSubmitting(false);
      }
    },
    [agentId, chatSessionId, emit, isSubmitting, socketConnected],
  );

  const declineContact = useCallback(async () => {
    if (!agentId || !chatSessionId || isDeclining) return;

    const payload = {
      agent_id: agentId,
      chat_session_id: chatSessionId,
    };

    setIsDeclining(true);

    if (socketConnected) {
      emit("atlas-visitor-handover-contact-decline", payload);
      return;
    }

    try {
      const response = await declineHandoverContact(payload);
      if (!response.success) {
        toast.error(response.message || "Unable to skip contact form.");
        setIsDeclining(false);
        return;
      }

      setHandover((prev) => ({
        ...prev,
        isActive: true,
        showContactForm: false,
        contactStatus: "declined",
      }));
      setIsDeclining(false);
    } catch (error: unknown) {
      toast.error(
        extractHumanHandoverApiError(error, "Unable to skip contact form."),
      );
      setIsDeclining(false);
    }
  }, [agentId, chatSessionId, emit, isDeclining, socketConnected]);

  return {
    handover,
    isSubmitting,
    isDeclining,
    submitContact,
    declineContact,
  };
}
