import Cookies from "js-cookie";
import fastApiAxios from "@/utils/fastapi_axios";
import type {
  CreatePluginRequest,
  DeletePluginResponse,
  ListPluginsResponse,
  PluginResponse,
  SetPluginSecretsRequest,
  UpdatePluginRequest,
} from "@/types/plugins";

const PLUGINS_BASE = "/elysium-agents/elysium-atlas/plugins/v1";

function getAuthHeaders() {
  const token = Cookies.get("elysium_atlas_session_token");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchPlugins(
  page: number,
  limit: number,
  includeInactive = true,
): Promise<ListPluginsResponse> {
  const response = await fastApiAxios.post(
    `${PLUGINS_BASE}/list-plugins`,
    { page, limit, include_inactive: includeInactive },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function getPlugin(pluginId: string): Promise<PluginResponse> {
  const response = await fastApiAxios.post(
    `${PLUGINS_BASE}/get-plugin`,
    { plugin_id: pluginId },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function createPlugin(
  payload: CreatePluginRequest,
): Promise<PluginResponse> {
  const response = await fastApiAxios.post(
    `${PLUGINS_BASE}/create-plugin`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function updatePlugin(
  payload: UpdatePluginRequest,
): Promise<PluginResponse> {
  const response = await fastApiAxios.post(
    `${PLUGINS_BASE}/update-plugin`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function setPluginSecrets(
  payload: SetPluginSecretsRequest,
): Promise<PluginResponse> {
  const response = await fastApiAxios.post(
    `${PLUGINS_BASE}/set-plugin-secrets`,
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function deletePlugin(
  pluginId: string,
): Promise<DeletePluginResponse> {
  const response = await fastApiAxios.post(
    `${PLUGINS_BASE}/delete-plugin`,
    { plugin_id: pluginId },
    { headers: getAuthHeaders() },
  );
  return response.data;
}
