import Cookies from "js-cookie";
import nodeExpressAxios from "@/utils/node_express_apis";
import type {
  UpdateAccountSettingsRequest,
  UpdateAccountSettingsResponse,
} from "@/types/accountSettings";

function getAuthHeaders() {
  const token = Cookies.get("elysium_atlas_session_token");
  return { Authorization: `Bearer ${token}` };
}

export async function updateAccountSettings(
  payload: UpdateAccountSettingsRequest,
): Promise<UpdateAccountSettingsResponse> {
  const response = await nodeExpressAxios.post(
    "/elysium-atlas/v1/account/settings/update",
    payload,
    { headers: getAuthHeaders() },
  );
  return response.data;
}
