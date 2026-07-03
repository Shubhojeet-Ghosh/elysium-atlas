"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import aiSocket from "@/lib/aiSocket";
import { useAppDispatch, store } from "@/store";
import {
  setCapturedSessionMode,
  updateChatSessionPresence,
  type CapturedSessionMode,
} from "@/store/reducers/agentSlice";
import {
  abandonMonitorSession,
} from "@/utils/chatMonitorUtils";
import {
  emitStartTakeoverConversation,
  emitEndTakeoverConversation,
  emitResolveSession,
} from "@/utils/chatTakeoverUtils";
import type { TeamRole } from "@/types/auth";
import { canResolveChatSession } from "@/utils/teamPermissions";

function getTeamMemberDisplayName(profile: {
  firstName: string;
  lastName: string;
}): string | null {
  const name = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || null;
}

type UseCapturedSessionTakeoverOptions = {
  agent_id: string;
  chat_session_id: string;
  conversation_mode: CapturedSessionMode;
  user_id: string;
  team_role?: TeamRole | null;
  onReleased?: () => void;
  onResolved?: () => void;
};

export function useCapturedSessionTakeover({
  agent_id,
  chat_session_id,
  conversation_mode,
  user_id,
  team_role,
  onReleased,
  onResolved,
}: UseCapturedSessionTakeoverOptions) {
  const dispatch = useAppDispatch();
  const [isTakeoverPending, setIsTakeoverPending] = useState(false);
  const isTakeoverPendingRef = useRef(isTakeoverPending);
  useEffect(() => {
    isTakeoverPendingRef.current = isTakeoverPending;
  }, [isTakeoverPending]);

  const [isReleasePending, setIsReleasePending] = useState(false);
  const isReleasePendingRef = useRef(isReleasePending);
  useEffect(() => {
    isReleasePendingRef.current = isReleasePending;
  }, [isReleasePending]);

  const [isResolvePending, setIsResolvePending] = useState(false);
  const isResolvePendingRef = useRef(isResolvePending);
  useEffect(() => {
    isResolvePendingRef.current = isResolvePending;
  }, [isResolvePending]);

  const requestTakeover = useCallback(() => {
    if (conversation_mode !== "monitor" || isTakeoverPending) return;

    const visitor = store
      .getState()
      .agent.active_visitors.find((v) => v.chat_session_id === chat_session_id);
    const handlerId = visitor?.in_conversation_with;
    if (handlerId && handlerId !== user_id) {
      toast.error("This chat is already handled by another team member");
      return;
    }

    setIsTakeoverPending(true);
    emitStartTakeoverConversation(agent_id, chat_session_id);
  }, [
    agent_id,
    chat_session_id,
    conversation_mode,
    isTakeoverPending,
    user_id,
  ]);

  const requestRelease = useCallback(() => {
    if (conversation_mode !== "takeover" || isReleasePending) return;
    setIsReleasePending(true);
    emitEndTakeoverConversation(agent_id, chat_session_id);

    const visitor = store
      .getState()
      .agent.active_visitors.find((v) => v.chat_session_id === chat_session_id);

    if (visitor) {
      dispatch(
        updateChatSessionPresence({
          chat_session_id,
          visitor_online: visitor.visitor_online,
          sid: visitor.sid,
          in_conversation_with: null,
          in_conversation_with_name: null,
        }),
      );
    }

    setIsReleasePending(false);
    onReleased?.();
  }, [
    agent_id,
    chat_session_id,
    conversation_mode,
    dispatch,
    isReleasePending,
    onReleased,
  ]);

  const requestResolve = useCallback(() => {
    if (isResolvePending) return;

    const visitor = store
      .getState()
      .agent.active_visitors.find((v) => v.chat_session_id === chat_session_id);
    const handlerId = visitor?.in_conversation_with;

    if (
      !canResolveChatSession(team_role, {
        conversation_mode,
        in_conversation_with: handlerId,
        user_id,
      })
    ) {
      toast.error(
        "Only the team member handling this chat can mark it resolved",
      );
      return;
    }

    setIsResolvePending(true);
    emitResolveSession(agent_id, chat_session_id);
  }, [
    agent_id,
    chat_session_id,
    conversation_mode,
    isResolvePending,
    team_role,
    user_id,
  ]);

  useEffect(() => {
    if (conversation_mode === "takeover") {
      setIsTakeoverPending(false);
    }
    if (conversation_mode === "monitor") {
      setIsReleasePending(false);
      setIsResolvePending(false);
    }
  }, [conversation_mode]);

  useEffect(() => {
    const handleMonitorEnded = (data: {
      success: boolean;
      agent_id: string;
      chat_session_id: string;
      reason?: string;
      message?: string | null;
    }) => {
      if (data.agent_id !== agent_id || data.chat_session_id !== chat_session_id) {
        return;
      }

      if (data.reason === "switched_to_takeover") {
        abandonMonitorSession(chat_session_id);
        return;
      }

      if (!data.success && isTakeoverPendingRef.current) {
        setIsTakeoverPending(false);
        if (data.message) toast.error(data.message);
      }
    };

    const handleConversationStarted = (data: {
      success?: boolean;
      message?: string | null;
      agent_id?: string;
      chat_session_id: string;
      in_conversation_with?: string;
      conversation_mode?: string;
      switched_from_monitor?: boolean;
    }) => {
      if (data.chat_session_id !== chat_session_id) return;
      if (data.agent_id && data.agent_id !== agent_id) return;

      if (data.success === false) {
        if (isTakeoverPendingRef.current) {
          setIsTakeoverPending(false);
          if (data.message) toast.error(data.message);
        }

        if (data.in_conversation_with) {
          const visitor = store
            .getState()
            .agent.active_visitors.find(
              (v) => v.chat_session_id === chat_session_id,
            );
          if (visitor) {
            dispatch(
              updateChatSessionPresence({
                chat_session_id,
                visitor_online: visitor.visitor_online,
                sid: visitor.sid,
                in_conversation_with: data.in_conversation_with,
              }),
            );
          }
        }
        return;
      }

      if (data.conversation_mode !== "takeover" && !isTakeoverPendingRef.current) {
        return;
      }

      dispatch(
        setCapturedSessionMode({
          chat_session_id,
          conversation_mode: "takeover",
        }),
      );

      const visitor = store
        .getState()
        .agent.active_visitors.find(
          (v) => v.chat_session_id === chat_session_id,
        );

      if (visitor) {
        dispatch(
          updateChatSessionPresence({
            chat_session_id,
            visitor_online: visitor.visitor_online,
            sid: visitor.sid,
            in_conversation_with: data.in_conversation_with ?? user_id,
            in_conversation_with_name: getTeamMemberDisplayName(
              store.getState().userProfile,
            ),
          }),
        );
      }

      setIsTakeoverPending(false);
    };

    const handleSessionResolved = (data: {
      success?: boolean;
      message?: string | null;
      agent_id?: string;
      chat_session_id: string;
      status?: string;
      already_resolved?: boolean;
    }) => {
      if (data.chat_session_id !== chat_session_id) return;
      if (data.agent_id && data.agent_id !== agent_id) return;
      if (!isResolvePendingRef.current) return;

      setIsResolvePending(false);

      if (data.success === false) {
        toast.error(
          data.message ?? "Could not mark this conversation as resolved",
        );
        return;
      }

      const visitor = store
        .getState()
        .agent.active_visitors.find(
          (v) => v.chat_session_id === chat_session_id,
        );

      if (visitor) {
        dispatch(
          updateChatSessionPresence({
            chat_session_id,
            visitor_online: visitor.visitor_online,
            sid: visitor.sid,
            in_conversation_with: null,
            in_conversation_with_name: null,
          }),
        );
      }

      if (!data.already_resolved) {
        toast.success("Conversation marked as resolved");
      }

      onResolved?.();
    };

    aiSocket.on("monitor_conversation_ended", handleMonitorEnded);
    aiSocket.on("conversation_started", handleConversationStarted);
    aiSocket.on("chat_session_resolved", handleSessionResolved);

    return () => {
      aiSocket.off("monitor_conversation_ended", handleMonitorEnded);
      aiSocket.off("conversation_started", handleConversationStarted);
      aiSocket.off("chat_session_resolved", handleSessionResolved);
    };
  }, [agent_id, chat_session_id, dispatch, onResolved, user_id]);

  return {
    requestTakeover,
    requestRelease,
    requestResolve,
    isTakeoverPending,
    isReleasePending,
    isResolvePending,
  };
}
