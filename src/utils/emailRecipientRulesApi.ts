import fastApiAxios from "@/utils/fastapi_axios";

export interface EmailRecipientRule {
  recipient_rule_id: string;
  team_id: string;
  rule_name?: string;
  recipient_prompt: string;
  cc_user_ids: string[];
  bcc_user_ids: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ListTeamEmailRecipientRulesResponse {
  success: boolean;
  message?: string;
  team_id?: string;
  count?: number;
  rules?: EmailRecipientRule[];
}

export interface CreateEmailRecipientRuleResponse {
  success: boolean;
  message?: string;
  rule?: EmailRecipientRule;
}

export interface UpdateEmailRecipientRuleResponse {
  success: boolean;
  message?: string;
  rule?: EmailRecipientRule;
}

export async function createEmailRecipientRule(
  teamId: string,
  ruleName: string,
  recipientPrompt: string,
  ccUserIds: string[],
  bccUserIds: string[],
) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-recipient-rules/v1/create",
    {
      team_id: teamId,
      rule_name: ruleName.trim(),
      recipient_prompt: recipientPrompt.trim(),
      cc_user_ids: ccUserIds,
      bcc_user_ids: bccUserIds,
    },
  );

  return response.data as CreateEmailRecipientRuleResponse;
}

export async function updateEmailRecipientRule(
  recipientRuleId: string,
  teamId: string,
  ruleName: string,
  recipientPrompt: string,
  ccUserIds: string[],
  bccUserIds: string[],
) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-recipient-rules/v1/update",
    {
      recipient_rule_id: recipientRuleId,
      team_id: teamId,
      rule_name: ruleName.trim(),
      recipient_prompt: recipientPrompt.trim(),
      cc_user_ids: ccUserIds,
      bcc_user_ids: bccUserIds,
    },
  );

  return response.data as UpdateEmailRecipientRuleResponse;
}

export async function listTeamEmailRecipientRules(teamId: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email-recipient-rules/v1/list-team-rules",
    { team_id: teamId },
  );

  return response.data as ListTeamEmailRecipientRulesResponse;
}
