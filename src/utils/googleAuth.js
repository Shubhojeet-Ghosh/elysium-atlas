// utils/googleAuth.js

export function openGoogleOAuth({
  clientId,
  redirectUri,
  state = "elysium-login",
}) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: "profile email openid",
    include_granted_scopes: "true",
    state,
    prompt: "select_account",
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// To extract the access token from the URL after redirect:
export function getGoogleAccessTokenFromHash() {
  if (typeof window === "undefined") return null;
  if (window.location.hash.includes("access_token=")) {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    // Optional: clear the hash
    window.location.hash = "";
    return accessToken;
  }
  return null;
}
