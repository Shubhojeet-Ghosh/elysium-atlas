import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";
import { canManageAgents } from "@/utils/teamPermissions";

export function useCanManageAgents(): boolean {
  const teamRole = useActiveTeamRole();
  return canManageAgents(teamRole);
}

/** True when the user may only view agent settings (team role: member). */
export function useAgentReadOnly(): boolean {
  return !useCanManageAgents();
}
