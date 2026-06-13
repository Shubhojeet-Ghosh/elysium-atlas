import Cookies from "js-cookie";
import type { AppDispatch } from "@/store";
import {
  setFirstName,
  setLastName,
  setProfilePicture,
  setIsProfileComplete,
  setUserID,
  setTeamID,
  setTeamRole,
  setUserEmail,
} from "@/store/reducers/userProfileSlice";
import { setTeams, setTeamSelectionPending } from "@/store/reducers/teamsSlice";
import type {
  AtlasAuthUser,
  AtlasDirectLoginResponse,
  AtlasPhase1LoginResponse,
  TeamRole,
  UserTeam,
} from "@/types/auth";
import { getRedirectUrl } from "@/utils/redirectUtils";

export const SELECTION_TOKEN_KEY = "elysium_atlas_selection_token";
export const SELECTION_TEAMS_KEY = "elysium_atlas_selection_teams";
export const SELECTION_USER_KEY = "elysium_atlas_selection_user";
export const SELECTION_PROFILE_COMPLETE_KEY =
  "elysium_atlas_selection_profile_complete";
export const SELECTION_REDIRECT_KEY = "elysium_atlas_selection_redirect";
export const PENDING_TEAM_SELECTION_COOKIE =
  "elysium_atlas_pending_team_selection";

export interface TeamSelectionPending {
  selection_token: string;
  teams: UserTeam[];
  user: AtlasAuthUser;
  is_profile_complete: boolean;
}

export type Phase1LoginResult =
  | { type: "direct"; data: AtlasDirectLoginResponse }
  | { type: "team_selection"; data: TeamSelectionPending }
  | { type: "magic_link_sent" }
  | { type: "error"; message: string };

function isTeamSelectionRequired(
  data: Record<string, unknown>,
): data is Record<string, unknown> & {
  requires_team_selection: true;
  selection_token: string;
  teams: UserTeam[];
  user: AtlasAuthUser;
  is_profile_complete: boolean;
} {
  return data.requires_team_selection === true;
}

function isDirectLogin(
  data: Record<string, unknown>,
): data is Record<string, unknown> & AtlasDirectLoginResponse {
  return (
    typeof data.sessionToken === "string" &&
    Boolean(data.user) &&
    !data.requires_team_selection
  );
}

export function parsePhase1LoginResponse(
  responseData: Record<string, unknown>,
): Phase1LoginResult {
  if (!responseData.success) {
    return {
      type: "error",
      message:
        typeof responseData.message === "string"
          ? responseData.message
          : "Login failed.",
    };
  }

  if (isTeamSelectionRequired(responseData)) {
    return {
      type: "team_selection",
      data: {
        selection_token: responseData.selection_token,
        teams: responseData.teams,
        user: responseData.user,
        is_profile_complete: responseData.is_profile_complete ?? true,
      },
    };
  }

  if (isDirectLogin(responseData)) {
    return {
      type: "direct",
      data: responseData as AtlasDirectLoginResponse,
    };
  }

  if (responseData.user) {
    return {
      type: "error",
      message: "Unexpected login response. Please try again.",
    };
  }

  return { type: "magic_link_sent" };
}

export function saveTeamSelectionPending(
  data: TeamSelectionPending,
  redirectPath?: string,
): void {
  sessionStorage.setItem(SELECTION_TOKEN_KEY, data.selection_token);
  sessionStorage.setItem(SELECTION_TEAMS_KEY, JSON.stringify(data.teams));
  sessionStorage.setItem(SELECTION_USER_KEY, JSON.stringify(data.user));
  sessionStorage.setItem(
    SELECTION_PROFILE_COMPLETE_KEY,
    String(data.is_profile_complete),
  );
  if (redirectPath) {
    sessionStorage.setItem(SELECTION_REDIRECT_KEY, redirectPath);
  }
}

export function clearTeamSelectionPending(): void {
  sessionStorage.removeItem(SELECTION_TOKEN_KEY);
  sessionStorage.removeItem(SELECTION_TEAMS_KEY);
  sessionStorage.removeItem(SELECTION_USER_KEY);
  sessionStorage.removeItem(SELECTION_PROFILE_COMPLETE_KEY);
  sessionStorage.removeItem(SELECTION_REDIRECT_KEY);
  clearPendingTeamSelectionCookie();
}

export function getTeamSelectionRedirectPath(): string | null {
  return sessionStorage.getItem(SELECTION_REDIRECT_KEY);
}

export function getTeamSelectionPending(): TeamSelectionPending | null {
  const selection_token = sessionStorage.getItem(SELECTION_TOKEN_KEY);
  const teamsRaw = sessionStorage.getItem(SELECTION_TEAMS_KEY);
  const userRaw = sessionStorage.getItem(SELECTION_USER_KEY);
  const profileCompleteRaw = sessionStorage.getItem(
    SELECTION_PROFILE_COMPLETE_KEY,
  );

  if (!selection_token || !teamsRaw || !userRaw) {
    return null;
  }

  try {
    return {
      selection_token,
      teams: JSON.parse(teamsRaw) as UserTeam[],
      user: JSON.parse(userRaw) as AtlasAuthUser,
      is_profile_complete: profileCompleteRaw !== "false",
    };
  } catch {
    return null;
  }
}

export function setPendingTeamSelectionCookie(): void {
  Cookies.set(PENDING_TEAM_SELECTION_COOKIE, "1", {
    path: "/",
    expires: 1 / 144, // ~10 minutes
  });
}

export function clearPendingTeamSelectionCookie(): void {
  Cookies.remove(PENDING_TEAM_SELECTION_COOKIE, { path: "/" });
}

export function applyPartialIdentityToStore(
  dispatch: AppDispatch,
  data: TeamSelectionPending,
): void {
  dispatch(setProfilePicture(data.user.profile_image_url || ""));
  dispatch(setUserID(data.user.user_id || ""));
  dispatch(setTeamID(""));
  dispatch(setTeamRole(data.user.role ?? null));
  dispatch(setTeams(data.teams ?? []));
  dispatch(setUserEmail(data.user.email || ""));
  dispatch(setFirstName(data.user.first_name || ""));
  dispatch(setLastName(data.user.last_name || ""));
  dispatch(setIsProfileComplete(data.is_profile_complete ?? true));
}

export function applyLoginToStore(
  dispatch: AppDispatch,
  data: {
    sessionToken: string;
    teams: UserTeam[];
    user: AtlasAuthUser & { team_id: string; role: TeamRole };
    is_profile_complete: boolean;
  },
): void {
  Cookies.set("elysium_atlas_session_token", data.sessionToken, {
    path: "/",
    expires: 1,
  });

  dispatch(setProfilePicture(data.user.profile_image_url || ""));
  dispatch(setUserID(data.user.user_id || ""));
  dispatch(setTeamID(data.user.team_id || ""));
  dispatch(setTeamRole(data.user.role ?? null));
  dispatch(setTeams(data.teams ?? []));
  dispatch(setUserEmail(data.user.email || ""));
  dispatch(setFirstName(data.user.first_name || ""));
  dispatch(setLastName(data.user.last_name || ""));
  dispatch(setIsProfileComplete(data.is_profile_complete ?? true));
}

export function redirectAfterLogin(redirectPath?: string): void {
  const target = redirectPath || getRedirectUrl();
  window.location.href = target;
}

export function handlePhase1LoginResult(
  dispatch: AppDispatch,
  result: Phase1LoginResult,
  redirectPath?: string,
): "direct" | "team_selection" | "magic_link_sent" | "error" {
  switch (result.type) {
    case "direct":
      applyLoginToStore(dispatch, result.data);
      redirectAfterLogin(redirectPath);
      return "direct";
    case "team_selection":
      saveTeamSelectionPending(result.data, redirectPath);
      dispatch(
        setTeamSelectionPending({
          pending: result.data,
          redirectPath,
        }),
      );
      return "team_selection";
    case "magic_link_sent":
      return "magic_link_sent";
    case "error":
      return "error";
  }
}
