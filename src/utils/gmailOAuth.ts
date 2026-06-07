export const GMAIL_OAUTH_CODE_KEY = "gmail_oauth_code";
export const GMAIL_OAUTH_STATE_KEY = "gmail_oauth_state";
export const GMAIL_INBOX_NAME_DRAFT_KEY = "gmail_inbox_name_draft";

/** Keep in sync with backend config/gmail_oauth_config.py */
export const GMAIL_OAUTH_SCOPE_URLS = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
  "openid",
  "email",
  "profile",
] as const;

const GMAIL_OAUTH_SCOPES = GMAIL_OAUTH_SCOPE_URLS.join(" ");

/** Required Gmail scopes — all three must be granted on connect/reconnect. */
const REQUIRED_GMAIL_SCOPES = [
  "gmail.readonly",
  "gmail.compose",
  "gmail.send",
] as const;

function hasRequiredGmailScopes(grantedScope: string): boolean {
  return REQUIRED_GMAIL_SCOPES.every((scope) => grantedScope.includes(scope));
}

export function getGmailOAuthRedirectUri(): string {
  if (process.env.NEXT_PUBLIC_GMAIL_OAUTH_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_GMAIL_OAUTH_REDIRECT_URI;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/email/inbox-settings`;
  }
  return "http://localhost:3000/email/inbox-settings";
}

export function getGmailOAuthCode(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(GMAIL_OAUTH_CODE_KEY);
}

export function clearGmailOAuthCode(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GMAIL_OAUTH_CODE_KEY);
  sessionStorage.removeItem(GMAIL_OAUTH_STATE_KEY);
}

export function openGmailOAuth(inboxNameDraft = ""): void {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Google client ID is not configured.");
  }

  const redirectUri = getGmailOAuthRedirectUri();
  const state = crypto.randomUUID();

  sessionStorage.setItem(GMAIL_OAUTH_STATE_KEY, state);
  if (inboxNameDraft.trim()) {
    sessionStorage.setItem(GMAIL_INBOX_NAME_DRAFT_KEY, inboxNameDraft.trim());
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GMAIL_OAUTH_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GmailOAuthCallbackResult =
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "none" };

export function handleGmailOAuthCallback(): GmailOAuthCallbackResult {
  if (typeof window === "undefined") return { status: "none" };

  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  const code = params.get("code");
  const grantedScope = params.get("scope");
  const returnedState = params.get("state");

  if (!error && !code) {
    return { status: "none" };
  }

  window.history.replaceState({}, "", "/email/inbox-settings");

  if (error) {
    return {
      status: "error",
      message:
        error === "access_denied"
          ? "Google access was denied."
          : "Google authorization failed.",
    };
  }

  if (!code) {
    return { status: "none" };
  }

  if (grantedScope && !hasRequiredGmailScopes(grantedScope)) {
    return {
      status: "error",
      message:
        "Google did not grant all required Gmail permissions (read, compose, send). Please reconnect and approve every permission.",
    };
  }

  const expectedState = sessionStorage.getItem(GMAIL_OAUTH_STATE_KEY);
  if (!expectedState || returnedState !== expectedState) {
    sessionStorage.removeItem(GMAIL_OAUTH_STATE_KEY);
    return {
      status: "error",
      message: "Invalid OAuth state. Please try connecting again.",
    };
  }

  sessionStorage.setItem(GMAIL_OAUTH_CODE_KEY, code);
  sessionStorage.removeItem(GMAIL_OAUTH_STATE_KEY);

  return { status: "success" };
}

export function readGmailInboxNameDraft(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(GMAIL_INBOX_NAME_DRAFT_KEY) || "";
}

export function clearGmailInboxNameDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GMAIL_INBOX_NAME_DRAFT_KEY);
}
