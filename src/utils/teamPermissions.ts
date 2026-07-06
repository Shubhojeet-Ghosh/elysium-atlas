import type { TeamRole } from "@/types/auth";

export function canManageTeamMembers(
  role: TeamRole | null | undefined,
): boolean {
  return role === "owner" || role === "admin";
}

/** Owner/admin may monitor while another team member holds takeover. */
export function canMonitorDuringActiveTakeover(
  role: TeamRole | null | undefined,
): boolean {
  return canManageTeamMembers(role);
}

/** True when this user must not open/maintain monitor on a peer-owned takeover. */
export function isPeerTakeoverMonitorBlocked(
  role: TeamRole | null | undefined,
  in_conversation_with: string | null | undefined,
  user_id: string,
): boolean {
  if (!in_conversation_with || in_conversation_with === user_id) return false;
  return !canMonitorDuringActiveTakeover(role);
}

/** Owner and admin can create, edit, and delete agents. Members are read-only. */
export function canManageAgents(
  role: TeamRole | null | undefined,
): boolean {
  return canManageTeamMembers(role);
}

/** Who may mark a chat session resolved (see live-visitor-chat.md). */
export function canResolveChatSession(
  role: TeamRole | null | undefined,
  {
    conversation_mode,
    in_conversation_with,
    user_id,
    is_resolved = false,
  }: {
    conversation_mode: "monitor" | "takeover";
    in_conversation_with: string | null | undefined;
    user_id: string;
    is_resolved?: boolean;
  },
): boolean {
  if (is_resolved) return false;
  if (canManageTeamMembers(role)) return true;
  if (conversation_mode !== "takeover") return false;
  if (!in_conversation_with) return true;
  return in_conversation_with === user_id;
}

/** Who may update session lead fields (see live-visitor-chat.md). */
export function canUpdateSessionLead(
  role: TeamRole | null | undefined,
  {
    in_conversation_with,
    user_id,
  }: {
    in_conversation_with: string | null | undefined;
    user_id: string;
  },
): boolean {
  if (canManageTeamMembers(role)) return true;
  return Boolean(in_conversation_with && in_conversation_with === user_id);
}
