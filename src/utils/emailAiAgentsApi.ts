import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";

const EMAIL_SESSION_COOKIE = "email-session-token";

export type EmailAgentSyncStatus = "idle" | "syncing" | "error";
export type EmailMessageDirection = "inbound" | "outbound";
export type EmailReplyActionMode = "draft" | "auto_send";
export type EmailAiActionStatus =
  | "draft_ready"
  | "sent"
  | "resolved"
  | "superseded";
export type EmailAiActionType = "draft" | "draft_fallback" | "auto_send";
export type EmailAiOutcomeType = "draft_created" | "auto_sent";

export interface EmailAiActionRecipients {
  to: string[];
  cc: string[];
  bcc: string[];
  cc_users?: Array<{ user_id: string; email: string; name: string }>;
  bcc_users?: Array<{ user_id: string; email: string; name: string }>;
  matched_recipient_rules?: Array<{
    _id?: string;
    rule_name: string;
    cc: string[];
    bcc: string[];
  }>;
}

export interface EmailAiAction {
  status: EmailAiActionStatus;
  type: EmailAiActionType;
  flow_run_id?: string;
  trigger_message_id?: string;
  gmail_draft_id?: string;
  gmail_draft_message_id?: string;
  gmail_message_id?: string;
  confidence?: number;
  auto_send_min_confidence?: number;
  threshold_met?: boolean;
  fallback_reason?: string;
  subject?: string;
  body_text?: string;
  recipients?: EmailAiActionRecipients;
  created_at?: string;
  resolved_at?: string | null;
}

export interface EmailAiOutcome {
  type: EmailAiOutcomeType;
  flow_run_id?: string;
  gmail_draft_id?: string;
  gmail_message_id?: string;
  confidence?: number;
  auto_send_min_confidence?: number;
  threshold_met?: boolean;
  fallback_reason?: string;
  recipients?: EmailAiActionRecipients;
}

export interface EmailAiReply {
  assisted: boolean;
  mode: "reviewed" | "auto";
  flow_run_id?: string;
  agent_id?: string;
  confidence?: number;
  gmail_draft_id?: string;
  sender_email?: string;
  sender_name?: string;
}

export type EmailAiStatusState = "processing" | "idle" | "failed";

export interface EmailAiStatus {
  current_status: EmailAiStatusState;
  flow_run_id?: string;
  trigger_message_id?: string;
  started_at?: string;
  updated_at?: string;
  last_error?: string | null;
}

export interface EmailReplyAction {
  mode: EmailReplyActionMode;
  auto_send_min_confidence: number;
}

export const DEFAULT_REPLY_ACTION: EmailReplyAction = {
  mode: "draft",
  auto_send_min_confidence: 0.8,
};

export interface EmailPagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface EmailAiAgent {
  agent_id: string;
  name: string;
  flow_id?: string;
  gmail_account_id: string;
  user_id?: string;
  team_id?: string;
  inbox_name?: string;
  email_address?: string;
  status?: string;
  activated_at?: string | null;
  sync_status?: EmailAgentSyncStatus;
  last_synced_at?: string | null;
  last_sync_error?: string | null;
  system_prompt?: string;
  email_format_template?: string;
  knowledge_id?: string;
  tool_ids?: string[];
  llm_model?: string;
  reply_action?: EmailReplyAction;
  routing_rule_ids?: string[];
  recipient_rule_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface EmailThread {
  thread_id: string;
  agent_id: string;
  gmail_account_id: string;
  team_id: string;
  subject: string;
  snippet: string;
  latest_from: string;
  participants: string[];
  last_message_at: string;
  message_count: number;
  has_unread: boolean;
  department_id?: string;
  assigned_user_id?: string;
  is_ai_processing?: boolean;
  ai_status?: EmailAiStatus | null;
  action_required?: boolean;
  ai_action?: EmailAiAction | null;
  updated_at: string;
}

export interface EmailThreadMessage {
  message_id: string;
  gmail_message_id: string;
  thread_id: string;
  direction: EmailMessageDirection;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  reply_to?: string;
  subject?: string;
  snippet?: string;
  body_text?: string;
  body_html?: string;
  received_at: string;
  is_unread?: boolean;
  label_ids?: string[];
  processing_status?: string;
  flow_run_id?: string;
  processed_at?: string;
  ai_outcome?: EmailAiOutcome;
  ai_reply?: EmailAiReply;
  created_at?: string;
}

export interface EmailThreadSummary {
  thread_id: string;
  subject: string;
  snippet: string;
  message_count: number;
  has_unread: boolean;
  department_id?: string;
  assigned_user_id?: string;
  is_ai_processing?: boolean;
  ai_status?: EmailAiStatus | null;
  action_required?: boolean;
  ai_action?: EmailAiAction | null;
}

export interface ListTeamEmailAiAgentsResponse {
  success: boolean;
  message?: string;
  team_id?: string;
  count?: number;
  agents?: EmailAiAgent[];
}

export interface ListTeamThreadsResponse {
  success: boolean;
  message?: string;
  team_id?: string;
  count?: number;
  threads?: EmailThread[];
  pagination?: EmailPagination;
}

export interface GetThreadResponse {
  success: boolean;
  message?: string;
  thread?: EmailThreadSummary;
  count?: number;
  messages?: EmailThreadMessage[];
  pagination?: EmailPagination;
}

export interface SendThreadDraftResponse {
  success: boolean;
  message?: string;
  data?: {
    thread_id: string;
    gmail_draft_id?: string;
    gmail_message_id?: string;
    gmail_thread_id?: string;
    label_ids?: string[];
    ai_action_status?: string;
  };
}

export interface GetEmailAiAgentResponse {
  success: boolean;
  message?: string;
  agent?: EmailAiAgent;
}

export interface EmailAgentAttachConflictData {
  flow_id?: string;
  attached_agent_id?: string;
  attached_agent_name?: string;
}

export interface CreateEmailAiAgentResponse {
  success: boolean;
  message?: string;
  agent?: EmailAiAgent;
  flow_synced?: boolean;
}

export interface UpdateEmailAiAgentResponse {
  success: boolean;
  message?: string;
  agent?: EmailAiAgent;
  flow_synced?: boolean;
}

function getEmailAuthHeaders() {
  const token = Cookies.get(EMAIL_SESSION_COOKIE);
  if (!token) {
    throw new Error("You must be logged in.");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function createEmailAiAgent(
  name: string,
  gmailAccountId: string,
  systemPrompt: string,
  llmModel: string,
  knowledgeId = "",
  toolIds: string[],
  replyAction: EmailReplyAction = DEFAULT_REPLY_ACTION,
  routingRuleIds: string[] = [],
  recipientRuleIds: string[] = [],
  emailFormatTemplate = "",
  flowId?: string,
) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-ai-agents/v1/create",
    {
      name: name.trim(),
      gmail_account_id: gmailAccountId,
      system_prompt: systemPrompt.trim(),
      email_format_template: emailFormatTemplate.trim(),
      knowledge_id: knowledgeId.trim() || null,
      tool_ids: toolIds,
      llm_model: llmModel,
      reply_action: replyAction,
      routing_rule_ids: routingRuleIds,
      recipient_rule_ids: recipientRuleIds,
      ...(flowId ? { flow_id: flowId } : {}),
    },
    {
      headers: getEmailAuthHeaders(),
    },
  );

  return response.data as CreateEmailAiAgentResponse;
}

export async function getEmailAiAgent(agentId: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-ai-agents/v1/get-agent",
    { agent_id: agentId },
  );

  return response.data as GetEmailAiAgentResponse;
}

export async function updateEmailAiAgent(
  agentId: string,
  name: string,
  gmailAccountId: string,
  systemPrompt: string,
  llmModel: string,
  knowledgeId = "",
  toolIds: string[],
  replyAction: EmailReplyAction = DEFAULT_REPLY_ACTION,
  routingRuleIds: string[] = [],
  recipientRuleIds: string[] = [],
  emailFormatTemplate = "",
  flowId?: string,
) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-ai-agents/v1/update",
    {
      agent_id: agentId,
      name: name.trim(),
      gmail_account_id: gmailAccountId,
      system_prompt: systemPrompt.trim(),
      email_format_template: emailFormatTemplate.trim(),
      knowledge_id: knowledgeId.trim() || null,
      tool_ids: toolIds,
      llm_model: llmModel,
      reply_action: replyAction,
      routing_rule_ids: routingRuleIds,
      recipient_rule_ids: recipientRuleIds,
      ...(flowId ? { flow_id: flowId } : {}),
    },
    {
      headers: getEmailAuthHeaders(),
    },
  );

  return response.data as UpdateEmailAiAgentResponse;
}

export async function listTeamEmailAiAgents(teamId: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-ai-agents/v1/list-team-agents",
    { team_id: teamId },
  );

  return response.data as ListTeamEmailAiAgentsResponse;
}

export async function triggerAgentSync(agentId: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-ai-agents/v1/trigger-sync",
    { agent_id: agentId },
    {
      headers: getEmailAuthHeaders(),
    },
  );

  return response.data;
}

export async function listTeamThreads(
  teamId: string,
  page = 1,
  limit = 25,
) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-ai-agents/v1/list-team-threads",
    { team_id: teamId, page, limit },
    {
      headers: getEmailAuthHeaders(),
    },
  );

  return response.data as ListTeamThreadsResponse;
}

export async function getEmailThread(
  teamId: string,
  threadId: string,
  page = 1,
  limit = 50,
) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-ai-agents/v1/get-thread",
    { team_id: teamId, thread_id: threadId, page, limit },
    {
      headers: getEmailAuthHeaders(),
    },
  );

  return response.data as GetThreadResponse;
}

export async function sendThreadDraft(teamId: string, threadId: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-ai-agents/v1/send-thread-draft",
    { team_id: teamId, thread_id: threadId },
    {
      headers: getEmailAuthHeaders(),
    },
  );

  return response.data as SendThreadDraftResponse;
}
