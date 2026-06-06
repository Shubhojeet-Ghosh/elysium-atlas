import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";

const EMAIL_SESSION_COOKIE = "email-session-token";

export interface GmailAccount {
  account_id: string;
  user_id?: string;
  team_id?: string;
  inbox_name: string;
  email_address: string;
  display_name?: string;
  status: string;
  connected_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ListGmailAccountsResponse {
  success: boolean;
  message?: string;
  count?: number;
  accounts?: GmailAccount[];
}

export async function createGmailAccount(inboxName: string, code: string) {
  const token = Cookies.get(EMAIL_SESSION_COOKIE);
  if (!token) {
    throw new Error("You must be logged in to connect a Gmail inbox.");
  }

  const response = await fastApiAxios.post(
    "/elysium-agents/email/gmail/v1/accounts",
    {
      inbox_name: inboxName.trim(),
      code,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

export async function listGmailAccounts() {
  const token = Cookies.get(EMAIL_SESSION_COOKIE);
  if (!token) {
    throw new Error("You must be logged in to view Gmail inboxes.");
  }

  const response = await fastApiAxios.get(
    "/elysium-agents/email/gmail/v1/accounts",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

export async function listTeamGmailAccounts(teamId: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/email/gmail/v1/list-team-accounts",
    { team_id: teamId },
  );

  return response.data;
}
