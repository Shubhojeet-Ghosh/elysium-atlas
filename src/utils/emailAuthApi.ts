import fastApiAxios from "@/utils/fastapi_axios";
import type { EmailUserRole } from "@/store/types/EmailUserTypes";

export interface RegisterEmailUserPayload {
  name: string;
  email: string;
  password: string;
  team_id: string;
  department_id: string;
  role: EmailUserRole;
}

export interface RegisterEmailUserResponse {
  success: boolean;
  message?: string;
  user?: {
    user_id: string;
    name: string;
    email: string;
    team_id: string;
    department_id: string;
    department_name?: string;
    role: EmailUserRole;
    created_at?: string;
    updated_at?: string;
  };
}

export async function registerEmailUser(payload: RegisterEmailUserPayload) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-auth/v1/register",
    {
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      team_id: payload.team_id.trim(),
      department_id: payload.department_id.trim(),
      role: payload.role,
    },
  );

  return response.data as RegisterEmailUserResponse;
}

export interface EmailTeamUser {
  user_id: string;
  name: string;
  email: string;
  team_id: string;
  department_id?: string;
  department_name?: string;
  department_description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ListTeamUsersResponse {
  success: boolean;
  message?: string;
  team_id?: string;
  count?: number;
  users?: EmailTeamUser[];
}

export async function listTeamUsers(teamId: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-auth/v1/list-team-users",
    { team_id: teamId },
  );

  return response.data as ListTeamUsersResponse;
}
