import type { TeamRole } from "@/types/auth";

export function canManageTeamMembers(
  role: TeamRole | null | undefined,
): boolean {
  return role === "owner" || role === "admin";
}

/** Owner and admin can create, edit, and delete agents. Members are read-only. */
export function canManageAgents(
  role: TeamRole | null | undefined,
): boolean {
  return canManageTeamMembers(role);
}
