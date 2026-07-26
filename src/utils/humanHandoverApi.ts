import Cookies from "js-cookie";
import fastApiAxios from "@/utils/fastapi_axios";
import type {
  DeclineHandoverContactRequest,
  DeclineHandoverContactResponse,
  GetHumanHandoverConfigResponse,
  ResetHumanHandoverConfigRequest,
  ResetHumanHandoverConfigResponse,
  SubmitHandoverContactRequest,
  SubmitHandoverContactResponse,
  UpdateHumanHandoverConfigRequest,
  UpdateHumanHandoverConfigResponse,
} from "@/types/humanHandover";

const HUMAN_HANDOVER_BASE =
  "/elysium-agents/elysium-atlas/human-handover/v1";

function getAuthHeaders() {
  const token = Cookies.get("elysium_atlas_session_token");
  return { Authorization: `Bearer ${token}` };
}

export async function getHumanHandoverConfig(
  agentId: string,
): Promise<GetHumanHandoverConfigResponse> {
  const response = await fastApiAxios.post(
    `${HUMAN_HANDOVER_BASE}/get-config`,
    { agent_id: agentId },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function updateHumanHandoverConfig(
  payload: UpdateHumanHandoverConfigRequest,
): Promise<UpdateHumanHandoverConfigResponse> {
  const response = await fastApiAxios.post(
    `${HUMAN_HANDOVER_BASE}/update-config`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function resetHumanHandoverConfig(
  payload: ResetHumanHandoverConfigRequest,
): Promise<ResetHumanHandoverConfigResponse> {
  const response = await fastApiAxios.post(
    `${HUMAN_HANDOVER_BASE}/reset-config`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function submitHandoverContact(
  payload: SubmitHandoverContactRequest,
): Promise<SubmitHandoverContactResponse> {
  const response = await fastApiAxios.post(
    `${HUMAN_HANDOVER_BASE}/submit-contact`,
    payload,
  );
  return response.data;
}

export async function declineHandoverContact(
  payload: DeclineHandoverContactRequest,
): Promise<DeclineHandoverContactResponse> {
  const response = await fastApiAxios.post(
    `${HUMAN_HANDOVER_BASE}/decline-contact`,
    payload,
  );
  return response.data;
}
