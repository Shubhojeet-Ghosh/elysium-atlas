import fastApiAxios from "@/utils/fastapi_axios";
import type { ListTeamKnowledgeResponse } from "@/store/types/EmailKnowledgeTypes";

export async function listTeamKnowledge(teamId: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-knowledge/v1/list-team-knowledge",
    { team_id: teamId },
  );

  return response.data as ListTeamKnowledgeResponse;
}
