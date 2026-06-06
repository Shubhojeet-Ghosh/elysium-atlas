import fastApiAxios from "@/utils/fastapi_axios";
import type {
  EmailDepartment,
  ListTeamDepartmentsResponse,
} from "@/store/types/EmailDepartmentsTypes";

export interface CreateEmailDepartmentResponse {
  success: boolean;
  message?: string;
  department?: EmailDepartment;
}

export async function createEmailDepartment(
  name: string,
  description: string,
  teamId: string,
) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-departments/v1/create",
    {
      name: name.trim(),
      description: description.trim(),
      team_id: teamId.trim(),
    },
  );

  return response.data as CreateEmailDepartmentResponse;
}

export async function listTeamDepartments(teamId: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-departments/v1/list-team-departments",
    { team_id: teamId },
  );

  return response.data as ListTeamDepartmentsResponse;
}
