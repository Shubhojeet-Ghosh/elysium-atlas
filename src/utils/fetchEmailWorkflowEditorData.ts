import type { AppDispatch } from "@/store";
import { setEmailDepartments } from "@/store/reducers/emailDepartmentsSlice";
import { setEmailKnowledge } from "@/store/reducers/emailKnowledgeSlice";
import { setEmailRules } from "@/store/reducers/emailRulesSlice";
import { setEmailTools } from "@/store/reducers/emailToolsSlice";
import { listTeamDepartments } from "@/utils/emailDepartmentsApi";
import { listTeamKnowledge } from "@/utils/emailKnowledgeApi";
import { listTeamEmailRecipientRules } from "@/utils/emailRecipientRulesApi";
import { listTeamEmailRoutingRules } from "@/utils/emailRoutingRulesApi";
import { listTeamTools } from "@/utils/emailToolDefinitionsApi";

export async function fetchEmailWorkflowEditorData(
  teamId: string,
  dispatch: AppDispatch,
) {
  if (!teamId) {
    return;
  }

  const [knowledgeData, toolsData, routingData, recipientData, departmentsData] =
    await Promise.all([
      listTeamKnowledge(teamId),
      listTeamTools(teamId),
      listTeamEmailRoutingRules(teamId, true),
      listTeamEmailRecipientRules(teamId),
      listTeamDepartments(teamId),
    ]);

  if (knowledgeData.success && Array.isArray(knowledgeData.knowledge_items)) {
    dispatch(
      setEmailKnowledge({
        teamID: teamId,
        knowledgeItems: knowledgeData.knowledge_items,
      }),
    );
  }

  if (toolsData.success && Array.isArray(toolsData.tools)) {
    dispatch(
      setEmailTools({
        teamID: teamId,
        tools: toolsData.tools,
      }),
    );
  }

  dispatch(
    setEmailRules({
      teamID: teamId,
      routingRules:
        routingData.success && Array.isArray(routingData.rules)
          ? routingData.rules
          : [],
      recipientRules:
        recipientData.success && Array.isArray(recipientData.rules)
          ? recipientData.rules
          : [],
    }),
  );

  if (departmentsData.success && Array.isArray(departmentsData.departments)) {
    dispatch(
      setEmailDepartments({
        teamID: teamId,
        departments: departmentsData.departments,
      }),
    );
  }
}
