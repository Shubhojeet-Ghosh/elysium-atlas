export interface HumanHandoverConfig {
  enable_human_handover: boolean;
  handover_trigger_prompt: string;
}

export interface GetHumanHandoverConfigRequest {
  agent_id: string;
}

export interface UpdateHumanHandoverConfigRequest {
  agent_id: string;
  enable_human_handover?: boolean;
  handover_trigger_prompt?: string;
}

export interface ResetHumanHandoverConfigRequest {
  agent_id: string;
}

export interface GetHumanHandoverConfigResponse {
  success: boolean;
  agent_id: string;
  human_handover_config: HumanHandoverConfig;
  message?: string;
}

export interface UpdateHumanHandoverConfigResponse {
  success: boolean;
  message?: string;
  agent_id: string;
  human_handover_config: HumanHandoverConfig;
}

export interface ResetHumanHandoverConfigResponse {
  success: boolean;
  message?: string;
  agent_id: string;
  human_handover_config: HumanHandoverConfig;
}

export type HandoverContactStatus = "pending" | "provided" | "declined";

export type HandoverStatus = "requested" | "assigned" | "resolved" | null;

export type SessionHandoverContactStatus = "pending" | "provided" | "declined" | null;

export interface SessionHandoverFields {
  handover_status?: HandoverStatus;
  handover_requested_at?: string | null;
  handover_reason?: string | null;
  handover_contact_name?: string | null;
  handover_contact_email?: string | null;
  handover_contact_status?: SessionHandoverContactStatus;
}

export interface ConversationStartedPayload {
  agent_id?: string;
  chat_session_id?: string;
  in_conversation_with: string;
  in_conversation_with_name?: string | null;
  message?: string;
}

export interface HandoverRequestedPayload {
  agent_id: string;
  chat_session_id: string;
  reason?: string;
  waiting_message?: string;
  show_contact_form?: boolean;
  contact_status?: HandoverContactStatus;
}

export interface HandoverContactSavedPayload {
  agent_id: string;
  chat_session_id: string;
  message?: string;
  contact_status?: HandoverContactStatus;
}

export interface HandoverContactDeclinedPayload {
  agent_id: string;
  chat_session_id: string;
  contact_status?: HandoverContactStatus;
}

export interface VisitorHandoverState {
  isActive: boolean;
  waitingMessage: string;
  reason?: string;
  showContactForm: boolean;
  contactStatus: HandoverContactStatus | null;
  contactSavedMessage: string | null;
}

export interface SubmitHandoverContactRequest {
  agent_id: string;
  chat_session_id: string;
  name: string;
  email: string;
}

export interface DeclineHandoverContactRequest {
  agent_id: string;
  chat_session_id: string;
}

export interface SubmitHandoverContactResponse {
  success: boolean;
  message?: string;
}

export interface DeclineHandoverContactResponse {
  success: boolean;
  message?: string;
}
