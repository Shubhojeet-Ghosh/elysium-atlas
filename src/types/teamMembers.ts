export type InvitableRole = "admin" | "member";
export type TeamMemberRole = "owner" | "admin" | "member";

export type InviteEmailStatus =
  | "invited"
  | "already_invited"
  | "not_registered"
  | "profile_incomplete"
  | "already_member"
  | "self_invite"
  | "invalid_email"
  | "duplicate_in_request"
  | "team_full"
  | "email_send_failed"
  | "invitation_unavailable";

export interface InviteEmailResult {
  email: string;
  status: InviteEmailStatus;
  email_resent?: boolean;
  invitation_id?: string;
  user_id?: string;
  expires_at?: string;
}

export interface InviteResponse {
  success: boolean;
  message: string;
  team_id?: string;
  summary?: { total: number; processed: number; skipped: number };
  results?: InviteEmailResult[];
}

export interface TeamMember {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_image_url: string | null;
  role: TeamMemberRole;
  status: "active" | "removed";
  joined_at: string;
}

export interface ListMembersResponse {
  success: boolean;
  message?: string;
  team_id?: string;
  current_team_size?: number;
  max_team_members?: number;
  page?: number;
  limit?: number;
  total?: number;
  members?: TeamMember[];
}

export interface InvitationPerson {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface InvitationPreview {
  invitation_id: string;
  team_id: string;
  team_name: string | null;
  inviter: InvitationPerson;
  invitee: InvitationPerson;
  role: InvitableRole;
  expires_at: string;
  status: "pending";
}

export interface PreviewResponse {
  success: boolean;
  message?: string;
  invitation?: InvitationPreview;
  invitation_status?: string;
}

export interface Membership {
  team_id: string;
  team_name: string | null;
  role: TeamMemberRole;
  joined_at: string;
}

export interface RespondResponse {
  success: boolean;
  message: string;
  membership?: Membership;
  invitation_status?: string;
}

export interface RemovedMember {
  user_id: string;
  email: string;
  role?: TeamMemberRole;
  status: "removed" | "active";
}

export interface RemoveMemberResponse {
  success: boolean;
  message: string;
  member?: RemovedMember;
}

export interface UpdateMemberRoleResponse {
  success: boolean;
  message: string;
  member?: {
    user_id: string;
    email: string;
    role: TeamMemberRole;
    status: "active" | "removed";
  };
}
