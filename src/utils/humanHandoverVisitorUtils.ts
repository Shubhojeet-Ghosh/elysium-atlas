import type {
  HandoverContactStatus,
  HandoverRequestedPayload,
  VisitorHandoverState,
} from "@/types/humanHandover";

export const DEFAULT_HANDOVER_WAITING_MESSAGE =
  "Your request to speak with a team member has been registered. Someone will join as soon as possible.";

export const DEFAULT_CONTACT_SAVED_MESSAGE =
  "Thanks — your details have been saved. A team member will follow up as soon as possible.";

export function createInitialVisitorHandoverState(): VisitorHandoverState {
  return {
    isActive: false,
    waitingMessage: "",
    reason: undefined,
    showContactForm: false,
    contactStatus: null,
    contactSavedMessage: null,
  };
}

export function shouldShowHandoverContactForm(
  showContactForm: boolean,
  contactStatus: HandoverContactStatus | null,
): boolean {
  return showContactForm && contactStatus === "pending";
}

export function shouldShowHandoverWaitingBanner(
  handover: VisitorHandoverState,
  inConversationWith: string | null,
): boolean {
  if (inConversationWith || !handover.isActive) return false;
  return !shouldShowHandoverContactForm(
    handover.showContactForm,
    handover.contactStatus,
  );
}

export function applyHandoverRequestedPayload(
  payload: HandoverRequestedPayload,
): VisitorHandoverState {
  const contactStatus = payload.contact_status ?? "pending";

  return {
    isActive: true,
    waitingMessage:
      payload.waiting_message?.trim() || DEFAULT_HANDOVER_WAITING_MESSAGE,
    reason: payload.reason,
    showContactForm: payload.show_contact_form === true,
    contactStatus,
    contactSavedMessage: null,
  };
}

export function parseVisitorHandoverFromSessionData(
  sessionData: Record<string, unknown> | null | undefined,
): VisitorHandoverState | null {
  if (!sessionData) return null;

  const handoverStatus =
    (sessionData.handover_status as string | undefined) ??
    (sessionData.handover as { status?: string } | undefined)?.status;

  if (handoverStatus !== "requested") {
    return null;
  }

  const contactStatus =
    (sessionData.handover_contact_status as HandoverContactStatus | undefined) ??
    (sessionData.handover as { contact_status?: HandoverContactStatus } | undefined)
      ?.contact_status ??
    "pending";

  const reason =
    (sessionData.handover_reason as string | undefined) ??
    (sessionData.handover as { reason?: string } | undefined)?.reason;

  const waitingMessage =
    (sessionData.handover_waiting_message as string | undefined) ??
    (sessionData.handover as { waiting_message?: string } | undefined)
      ?.waiting_message;

  const showContactForm =
    (sessionData.handover_show_contact_form as boolean | undefined) ??
    (sessionData.handover as { show_contact_form?: boolean } | undefined)
      ?.show_contact_form ??
    contactStatus === "pending";

  return {
    isActive: true,
    waitingMessage: waitingMessage?.trim() || DEFAULT_HANDOVER_WAITING_MESSAGE,
    reason,
    showContactForm: showContactForm === true,
    contactStatus,
    contactSavedMessage:
      contactStatus === "provided" ? DEFAULT_CONTACT_SAVED_MESSAGE : null,
  };
}

export function validateHandoverContactInput(
  name: string,
  email: string,
): string | null {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  if (!trimmedName) {
    return "Please enter your name.";
  }

  if (!trimmedEmail) {
    return "Please enter your email.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return "Please enter a valid email address.";
  }

  return null;
}

export function isHandoverSessionEvent(
  payload: { agent_id?: string; chat_session_id?: string },
  agentId: string,
  chatSessionId: string,
): boolean {
  return (
    payload.agent_id === agentId && payload.chat_session_id === chatSessionId
  );
}
