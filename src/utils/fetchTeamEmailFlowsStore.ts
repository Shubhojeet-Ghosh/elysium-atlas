import type { AppDispatch } from "@/store";
import { setEmailFlows } from "@/store/reducers/emailFlowsSlice";
import {
  listTeamEmailFlows,
  type EmailFlowSummary,
} from "@/utils/emailFlowsApi";

export async function fetchTeamEmailFlowsForStore(
  teamId: string,
  dispatch: AppDispatch,
): Promise<EmailFlowSummary[]> {
  if (!teamId) {
    dispatch(setEmailFlows({ teamID: "", flows: [] }));
    return [];
  }

  try {
    const response = await listTeamEmailFlows(teamId);
    const flows =
      response.success && Array.isArray(response.data?.flows)
        ? response.data.flows
        : [];

    dispatch(
      setEmailFlows({
        teamID: teamId,
        flows,
      }),
    );

    return flows;
  } catch {
    return [];
  }
}
