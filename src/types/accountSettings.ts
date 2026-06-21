import type { TeamRole } from "@/types/auth";

export interface UpdateAccountSettingsRequest {
  first_name?: string;
  last_name?: string;
  team_name?: string;
  current_password?: string;
  password?: string;
}

export interface AccountSettingsUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_image_url: string | null;
  team_id: string;
  team_name: string;
  role: TeamRole;
}

export interface UpdateAccountSettingsResponse {
  success: boolean;
  message: string;
  sessionToken?: string;
  user?: AccountSettingsUser;
}
