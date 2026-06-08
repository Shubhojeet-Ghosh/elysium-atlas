import type { EmailFlowSummary } from "@/utils/emailFlowsApi";

export type { EmailFlowSummary };

export interface EmailFlowsState {
  teamID: string;
  flows: EmailFlowSummary[];
  isLoaded: boolean;
}
