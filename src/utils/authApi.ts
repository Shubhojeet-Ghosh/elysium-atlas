import nodeExpressAxios from "@/utils/node_express_apis";
import type { AtlasSelectTeamResponse } from "@/types/auth";

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
