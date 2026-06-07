import fastApiAxios from "@/utils/fastapi_axios";
import type { ListTeamToolsResponse } from "@/store/types/EmailToolsTypes";

export async function listTeamTools(teamId: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-tool-definitions/v1/list-team-tools",
    { team_id: teamId },
  );

  return response.data as ListTeamToolsResponse;
}
