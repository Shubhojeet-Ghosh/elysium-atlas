import { useAppSelector } from "@/store";
import type { TeamRole } from "@/types/auth";

export function useActiveTeamRole(): TeamRole | null {
  const teamRole = useAppSelector((state) => state.userProfile.teamRole);
  const teamID = useAppSelector((state) => state.userProfile.teamID);
  const teams = useAppSelector((state) => state.teams.list);

  if (teamRole) return teamRole;
  if (!teamID) return null;

  return teams.find((team) => team.team_id === teamID)?.role ?? null;
}
