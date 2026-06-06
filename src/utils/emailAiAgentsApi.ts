import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";

const EMAIL_SESSION_COOKIE = "email-session-token";

export type EmailAgentSyncStatus = "idle" | "syncing" | "error";
export type EmailMessageDirection = "inbound" | "outbound";

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

function getEmailAuthHeaders() {
  const token = Cookies.get(EMAIL_SESSION_COOKIE);
  if (!token) {
    throw new Error("You must be logged in.");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function createEmailAiAgent(name: string, gmailAccountId: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-ai-agents/v1/create",
    {
      name: name.trim(),
      gmail_account_id: gmailAccountId,
    },
    {
      headers: getEmailAuthHeaders(),
    },
  );

  return response.data;
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
