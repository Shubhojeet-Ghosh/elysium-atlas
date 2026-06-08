import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import type { EmailReplyAction } from "@/utils/emailAiAgentsApi";

const EMAIL_SESSION_COOKIE = "email-session-token";

export type EmailFlowNodeType =
  | "start"
  | "load_thread_context"
  | "read_kb"
  | "read_tools"
  | "ai_department_router"
  | "ai_recipients_generator"
  | "generate_email"
  | "call_external_tool"
  | "save_gmail_draft"
  | "send_email"
  | "stop";

export interface EmailFlowNodeEdge {
  to: string;
}

export interface EmailFlowNodeDimensions {
  width?: number;
  height?: number;
}

export interface EmailFlowLayout {
  direction?: string;
  row_y?: number;
  step_x?: number;
  node_width?: number;
  node_height?: number;
  node_origin?: [number, number];
  source_handle?: string;
  target_handle?: string;
  edge_type?: string;
}

export interface EmailFlowApiEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface EmailFlowNodeDoc {
  node_id: string;
  type: EmailFlowNodeType;
  label?: string;
  position?: { x: number; y: number };
  dimensions?: EmailFlowNodeDimensions;
  config?: Record<string, unknown>;
  edges?: EmailFlowNodeEdge[];
  binding?: EmailFlowNodeBinding;
}

export interface EmailFlowNodeBinding {
  synced_from?: string;
  email_address?: string;
  inbox_name?: string;
  gmail_account_id?: string;
  knowledge_id?: string;
  title?: string;
  tools?: Array<{ tool_id: string; name?: string; display_name?: string }>;
  routing_rules?: Array<{
    routing_rule_id: string;
    rule_name: string;
    department_id?: string;
  }>;
  recipient_rules?: Array<{
    recipient_rule_id: string;
    rule_name: string;
  }>;
  llm_model?: string;
  reply_action?: EmailReplyAction;
  label_hint?: string;
}

export interface EmailFlowSummary {
  flow_id: string;
  attached_agent_id?: string;
  attached_agent_name?: string;
  gmail_account_id?: string;
  inbox_name?: string;
  email_address?: string;
  name: string;
  slug?: string;
  summary?: string;
  node_count?: number;
  is_system_default?: boolean;
  is_deletable?: boolean;
  is_editable?: boolean;
  is_attached?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmailFlowDetail extends EmailFlowSummary {
  team_id?: string;
  description?: string;
  is_read_only?: boolean;
  tail_mode?: "draft" | "auto_send";
  palette_node_types?: EmailFlowNodeType[];
  nodes?: EmailFlowNodeDoc[];
  edges?: EmailFlowApiEdge[];
  layout?: EmailFlowLayout;
  node_editor_schema?: Record<string, unknown>;
  validation_rules?: Record<string, unknown>;
  agent_synced?: boolean;
}

export interface CreateEmailFlowResponse {
  success: boolean;
  message?: string;
  data?: EmailFlowDetail;
}

export interface UpdateEmailFlowResponse {
  success: boolean;
  message?: string;
  data?: EmailFlowDetail & {
    agent_synced?: boolean;
    agent_synced_fields?: string[];
  };
}

export interface ListTeamEmailFlowsResponse {
  success: boolean;
  message?: string;
  data?: {
    team_id: string;
    count: number;
    flows: EmailFlowSummary[];
  };
}

export interface GetEmailFlowResponse {
  success: boolean;
  message?: string;
  data?: EmailFlowDetail;
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

export async function listTeamEmailFlows(teamId: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-flows/v1/list-team-flows",
    { team_id: teamId },
    {
      headers: getEmailAuthHeaders(),
    },
  );

  return response.data as ListTeamEmailFlowsResponse;
}

export async function getEmailFlow(flowId: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-flows/v1/get-flow",
    { flow_id: flowId },
    {
      headers: getEmailAuthHeaders(),
    },
  );

  return response.data as GetEmailFlowResponse;
}

export async function getEmailFlowForAgent(agentId: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-flows/v1/get-flow-for-agent",
    { agent_id: agentId },
    {
      headers: getEmailAuthHeaders(),
    },
  );

  return response.data as GetEmailFlowResponse;
}

export async function createEmailFlow(
  teamId: string,
  name: string,
  description = "",
) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-flows/v1/create",
    {
      team_id: teamId,
      name: name.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
    },
    {
      headers: getEmailAuthHeaders(),
    },
  );

  return response.data as CreateEmailFlowResponse;
}

export async function updateEmailFlow(
  flowId: string,
  nodes: EmailFlowNodeDoc[],
  name?: string,
  description?: string,
) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-flows/v1/update",
    {
      flow_id: flowId,
      nodes,
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
    },
    {
      headers: getEmailAuthHeaders(),
    },
  );

  return response.data as UpdateEmailFlowResponse;
}
