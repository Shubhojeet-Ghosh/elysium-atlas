import Cookies from "js-cookie";
import fastApiAxios from "@/utils/fastapi_axios";
import type {
  GetFieldCatalogResponse,
  GetLeadCollectionConfigResponse,
  ListTeamLeadsRequest,
  ListTeamLeadsResponse,
  ResetLeadCollectionConfigRequest,
  ResetLeadCollectionConfigResponse,
  UpdateLeadCollectionConfigRequest,
  UpdateLeadCollectionConfigResponse,
  UpdateSessionLeadRequest,
  UpdateSessionLeadResponse,
} from "@/types/leadCollection";

const LEAD_COLLECTION_BASE =
  "/elysium-agents/elysium-atlas/lead-collection/v1";

function getAuthHeaders() {
  const token = Cookies.get("elysium_atlas_session_token");
  return { Authorization: `Bearer ${token}` };
}

export async function getLeadCollectionConfig(
  agentId: string,
): Promise<GetLeadCollectionConfigResponse> {
  const response = await fastApiAxios.post(
    `${LEAD_COLLECTION_BASE}/get-config`,
    { agent_id: agentId },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function updateLeadCollectionConfig(
  payload: UpdateLeadCollectionConfigRequest,
): Promise<UpdateLeadCollectionConfigResponse> {
  const response = await fastApiAxios.post(
    `${LEAD_COLLECTION_BASE}/update-config`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function resetLeadCollectionConfig(
  payload: ResetLeadCollectionConfigRequest,
): Promise<ResetLeadCollectionConfigResponse> {
  const response = await fastApiAxios.post(
    `${LEAD_COLLECTION_BASE}/reset-config`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function getLeadFieldCatalog(): Promise<GetFieldCatalogResponse> {
  const response = await fastApiAxios.post(
    `${LEAD_COLLECTION_BASE}/get-field-catalog`,
    {},
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function updateSessionLead(
  payload: UpdateSessionLeadRequest,
): Promise<UpdateSessionLeadResponse> {
  const response = await fastApiAxios.post(
    `${LEAD_COLLECTION_BASE}/update-session-lead`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function listTeamLeads(
  payload: ListTeamLeadsRequest = {},
): Promise<ListTeamLeadsResponse> {
  const response = await fastApiAxios.post(
    `${LEAD_COLLECTION_BASE}/list-team-leads`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
}
