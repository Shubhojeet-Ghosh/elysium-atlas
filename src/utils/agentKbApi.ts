import Cookies from "js-cookie";
import fastApiAxios from "@/utils/fastapi_axios";
import type {
  AgentKbUpdateFields,
  KbAttachmentRow,
  ListAttachedCustomTextsResponse,
  ListAttachedFilesResponse,
  ListAttachedQaPairsResponse,
  ListAttachedUrlsResponse,
} from "@/types/agentKb";
import type { KbSourceType } from "@/types/kbItems";
import { reindexItem } from "@/utils/kbItemsApi";

const AGENT_BASE = "/elysium-agents/elysium-atlas/agent/v1";

async function listAttached<T>(
  endpoint: string,
  agentId: string,
  page: number,
  limit: number,
): Promise<T> {
  const response = await fastApiAxios.post(
    `${AGENT_BASE}/${endpoint}`,
    { agent_id: agentId, page, limit },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

function getAuthHeaders() {
  const token = Cookies.get("elysium_atlas_session_token");
  return { Authorization: `Bearer ${token}` };
}

export async function getAgentDetails(agentId: string) {
  const response = await fastApiAxios.post(
    `${AGENT_BASE}/get-agent-details`,
    { agent_id: agentId },
    { headers: getAuthHeaders() },
  );
  return response.data as {
    success: boolean;
    message?: string;
    agent_details?: {
      kb_attachments?: KbAttachmentRow[];
      [key: string]: unknown;
    };
  };
}

export async function updateAgentKb(
  agentId: string,
  fields: AgentKbUpdateFields & Record<string, unknown>,
) {
  const response = await fastApiAxios.post(
    `${AGENT_BASE}/update-agent`,
    { agent_id: agentId, ...fields },
    { headers: getAuthHeaders() },
  );
  return response.data as {
    success: boolean;
    message?: string;
    kb_attachments?: KbAttachmentRow[];
  };
}

export async function reindexKbItem(kbId: string, sourceType: KbSourceType) {
  return reindexItem(kbId, sourceType);
}

export async function listAttachedUrls(
  agentId: string,
  page = 1,
  limit = 20,
): Promise<ListAttachedUrlsResponse> {
  return listAttached<ListAttachedUrlsResponse>(
    "list-attached-urls",
    agentId,
    page,
    limit,
  );
}

export async function listAttachedFiles(
  agentId: string,
  page = 1,
  limit = 20,
): Promise<ListAttachedFilesResponse> {
  return listAttached<ListAttachedFilesResponse>(
    "list-attached-files",
    agentId,
    page,
    limit,
  );
}

export async function listAttachedCustomTexts(
  agentId: string,
  page = 1,
  limit = 20,
): Promise<ListAttachedCustomTextsResponse> {
  return listAttached<ListAttachedCustomTextsResponse>(
    "list-attached-custom-texts",
    agentId,
    page,
    limit,
  );
}

export async function listAttachedQaPairs(
  agentId: string,
  page = 1,
  limit = 20,
): Promise<ListAttachedQaPairsResponse> {
  return listAttached<ListAttachedQaPairsResponse>(
    "list-attached-qa-pairs",
    agentId,
    page,
    limit,
  );
}
