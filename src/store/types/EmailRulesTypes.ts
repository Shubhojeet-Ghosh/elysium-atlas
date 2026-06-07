import type { EmailRecipientRule } from "@/utils/emailRecipientRulesApi";
import type { EmailRoutingRule } from "@/utils/emailRoutingRulesApi";

export interface EmailRulesState {
  teamID: string;
  routingRules: EmailRoutingRule[];
  recipientRules: EmailRecipientRule[];
  isLoaded: boolean;
}
