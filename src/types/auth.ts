export type TeamRole = "owner" | "admin" | "member";

export interface UserTeam {
  team_id: string;
  team_name: string | null;
  is_owner: boolean;
  role: TeamRole;
}

export interface AtlasAuthUser {
  user_id: string;
  team_id: string | null;
  role: TeamRole | null;
  email: string;
  first_name: string;
  last_name: string;
  profile_image_url: string | null;
}

export interface AtlasDirectLoginResponse {
  success: true;
  message: string;
  is_profile_complete: boolean;
  sessionToken: string;
  teams: UserTeam[];
  user: AtlasAuthUser & { team_id: string; role: TeamRole };
}

export interface AtlasTeamSelectionRequiredResponse {
  success: true;
  requires_team_selection: true;
  message: string;
  selection_token: string;
  is_profile_complete: boolean;
  teams: UserTeam[];
  user: AtlasAuthUser & { team_id: null; role: null };
}

export interface AtlasSelectTeamResponse {
  success: boolean;
  message: string;
  is_profile_complete?: boolean;
  sessionToken?: string;
  teams?: UserTeam[];
  user?: AtlasAuthUser & { team_id: string; role: TeamRole };
}

export type AtlasPhase1LoginResponse =
  | AtlasDirectLoginResponse
  | AtlasTeamSelectionRequiredResponse;

export interface AtlasForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface AtlasResetPasswordResponse {
  success: boolean;
  message: string;
}
