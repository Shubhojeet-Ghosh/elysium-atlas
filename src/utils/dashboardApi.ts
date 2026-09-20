import Cookies from "js-cookie";
import fastApiAxios from "@/utils/fastapi_axios";
import type {
  ChatSessionCountsRequest,
  ChatSessionCountsResponse,
} from "@/types/dashboard";

const DASHBOARD_BASE = "/elysium-agents/elysium-atlas/dashboard/v1";

function getAuthHeaders() {
  const token = Cookies.get("elysium_atlas_session_token");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchChatSessionCounts(
  payload: ChatSessionCountsRequest,
): Promise<ChatSessionCountsResponse> {
  const response = await fastApiAxios.post(
    `${DASHBOARD_BASE}/chat-session-counts`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
}
