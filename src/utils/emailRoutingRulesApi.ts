import fastApiAxios from "@/utils/fastapi_axios";

export type EmailRoutingRuleStatus = "active" | "inactive";

export interface EmailRoutingRule {
  routing_rule_id: string;
  team_id: string;
  department_id: string;
  rule_name: string;
  routing_prompt: string;
  priority: number;
  is_fallback: boolean;
  status: EmailRoutingRuleStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ListTeamEmailRoutingRulesResponse {
  success: boolean;
  message?: string;
  team_id?: string;
  count?: number;
  rules?: EmailRoutingRule[];
}

export interface CreateEmailRoutingRuleResponse {
  success: boolean;
  message?: string;
  rule?: EmailRoutingRule;
}

export interface UpdateEmailRoutingRuleResponse {
  success: boolean;
  message?: string;
  rule?: EmailRoutingRule;
}

export const DEFAULT_ROUTING_RULE_PRIORITY = 100;

export async function createEmailRoutingRule(
  teamId: string,
  departmentId: string,
  ruleName: string,
  routingPrompt: string,
  priority = DEFAULT_ROUTING_RULE_PRIORITY,
  isFallback = false,
) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-routing-rules/v1/create",
    {
      team_id: teamId,
      department_id: departmentId,
      rule_name: ruleName.trim(),
      routing_prompt: routingPrompt.trim(),
      priority,
      is_fallback: isFallback,
    },
  );

  return response.data as CreateEmailRoutingRuleResponse;
}

export async function updateEmailRoutingRule(
  routingRuleId: string,
  teamId: string,
  departmentId: string,
  ruleName: string,
  routingPrompt: string,
  priority: number,
  isFallback: boolean,
  status: EmailRoutingRuleStatus,
) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-routing-rules/v1/update",
    {
      routing_rule_id: routingRuleId,
      team_id: teamId,
      department_id: departmentId,
      rule_name: ruleName.trim(),
      routing_prompt: routingPrompt.trim(),
      priority,
      is_fallback: isFallback,
      status,
    },
  );

  return response.data as UpdateEmailRoutingRuleResponse;
}

export async function listTeamEmailRoutingRules(
  teamId: string,
  includeInactive = true,
) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-routing-rules/v1/list-team-rules",
    {
      team_id: teamId,
      include_inactive: includeInactive,
    },
  );

  return response.data as ListTeamEmailRoutingRulesResponse;
}
