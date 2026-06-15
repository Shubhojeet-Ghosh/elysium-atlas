import Cookies from "js-cookie";
import fastApiAxios from "@/utils/fastapi_axios";
import type {
  CreateToolRequest,
  DeleteToolResponse,
  ListToolsResponse,
  ToolResponse,
  UpdateToolRequest,
} from "@/types/tools";

const TOOLS_BASE = "/elysium-agents/elysium-atlas/tools/v1";

function getAuthHeaders() {
  const token = Cookies.get("elysium_atlas_session_token");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchTools(
  page: number,
  limit: number,
  includeInactive = true,
): Promise<ListToolsResponse> {
  const response = await fastApiAxios.post(
    `${TOOLS_BASE}/list-tools`,
    { page, limit, include_inactive: includeInactive },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function getTool(toolId: string): Promise<ToolResponse> {
  const response = await fastApiAxios.post(
    `${TOOLS_BASE}/get-tool`,
    { tool_id: toolId },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function createTool(
  payload: CreateToolRequest,
): Promise<ToolResponse> {
  const response = await fastApiAxios.post(
    `${TOOLS_BASE}/create-tool`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function updateTool(
  payload: UpdateToolRequest,
): Promise<ToolResponse> {
  const response = await fastApiAxios.post(
    `${TOOLS_BASE}/update-tool`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function deleteTool(toolId: string): Promise<DeleteToolResponse> {
  const response = await fastApiAxios.post(
    `${TOOLS_BASE}/delete-tool`,
    { tool_id: toolId },
    { headers: getAuthHeaders() },
  );
  return response.data;
}
