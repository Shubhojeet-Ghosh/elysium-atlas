import Cookies from "js-cookie";
import nodeExpressAxios from "@/utils/node_express_apis";
import type {
  InvitableRole,
  InviteResponse,
  ListMembersResponse,
  PreviewResponse,
  RemoveMemberResponse,
  RespondResponse,
  UpdateMemberRoleResponse,
} from "@/types/teamMembers";

function getAuthHeaders() {
  const token = Cookies.get("elysium_atlas_session_token");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchTeamMembers(
  page: number,
  limit: number,
): Promise<ListMembersResponse> {
  const response = await nodeExpressAxios.get(
    `/elysium-atlas/v1/team/members?page=${page}&limit=${limit}&status=active`,
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function inviteTeamMembers(
  emails: string[],
  role: InvitableRole = "member",
): Promise<InviteResponse> {
  const response = await nodeExpressAxios.post(
    "/elysium-atlas/v1/team/members/invite",
    { emails, role },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function previewTeamInvitation(
  token: string,
): Promise<PreviewResponse> {
  const response = await nodeExpressAxios.post(
    "/elysium-atlas/v1/team/members/invitation/preview",
    { token },
  );
  return response.data;
}

export async function respondToTeamInvitation(
  token: string,
  accept: boolean,
): Promise<RespondResponse> {
  const response = await nodeExpressAxios.post(
    "/elysium-atlas/v1/team/members/invitation/respond",
    { token, accept },
  );
  return response.data;
}

export async function removeTeamMember(
  userId: string,
): Promise<RemoveMemberResponse> {
  const response = await nodeExpressAxios.post(
    "/elysium-atlas/v1/team/members/remove",
    { user_id: userId },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function updateTeamMemberRole(
  userId: string,
  role: InvitableRole,
): Promise<UpdateMemberRoleResponse> {
  const response = await nodeExpressAxios.post(
    "/elysium-atlas/v1/team/members/update-role",
    { user_id: userId, role },
    { headers: getAuthHeaders() },
  );
  return response.data;
}
