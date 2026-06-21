import nodeExpressAxios from "@/utils/node_express_apis";
import type {
  AtlasForgotPasswordResponse,
  AtlasResetPasswordResponse,
  AtlasSelectTeamResponse,
} from "@/types/auth";

export async function selectAuthTeam(
  selectionToken: string,
  teamId: string,
): Promise<AtlasSelectTeamResponse> {
  const response = await nodeExpressAxios.post(
    "/elysium-atlas/v1/auth/select-team",
    {
      selection_token: selectionToken,
      team_id: teamId,
    },
  );
  return response.data;
}

export async function requestPasswordReset(
  email: string,
): Promise<AtlasForgotPasswordResponse> {
  const response = await nodeExpressAxios.post(
    "/elysium-atlas/v1/auth/forgot-password",
    { email },
  );
  return response.data;
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<AtlasResetPasswordResponse> {
  const response = await nodeExpressAxios.post(
    "/elysium-atlas/v1/auth/reset-password",
    { token, password },
  );
  return response.data;
}
