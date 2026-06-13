import type { UserTeam } from "@/types/auth";
import type { TeamSelectionPending } from "@/utils/authLogin";

export interface TeamsState {
  list: UserTeam[];
  selectionPending: TeamSelectionPending | null;
  selectionRedirectPath: string | null;
}
