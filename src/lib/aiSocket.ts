import { io, Socket } from "socket.io-client";

const SERVER_URL =
  process.env.NEXT_PUBLIC_FASTAPI_SERVER_BASE_URL ||
  "https://ai.sgdevstudio.in";

const getTokenFromCookie = (cookieName: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${cookieName}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
};

const getSessionToken = (): string => {
  if (typeof window === "undefined") return "";
  return getTokenFromCookie("elysium_atlas_session_token") || "";
};

// Single shared socket instance for the whole app.
// `auth` as a callback means socket.io will re-read the token on every
// connect / reconnect attempt — no manual refresh needed.
//
// Resilience notes:
// - We allow both `websocket` and `polling`. If nginx / a proxy in the middle
//   kills the websocket ("transport close"), socket.io will gracefully fall
//   back to long-polling instead of giving up.
// - `rememberUpgrade: true` keeps using websocket once it has worked.
// - `reconnection: true` with infinite attempts + capped backoff means we
//   keep trying forever (with jitter) instead of going dark.
// - `timeout` is the per-attempt connect timeout.
const aiSocket: Socket = io(SERVER_URL, {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  upgrade: true,
  rememberUpgrade: true,
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  randomizationFactor: 0.5,
  reconnectionAttempts: Infinity,
  timeout: 20000,
  auth: (cb) => cb({ token: getSessionToken() }),
});

const isDev = process.env.NODE_ENV !== "production";
const log = (...args: unknown[]) => {
  if (isDev) console.log("[aiSocket]", ...args);
};

if (typeof window !== "undefined") {
  // When the SERVER ends the connection (e.g. nginx idle timeout, server
  // restart, auth issue), socket.io-client does NOT auto-reconnect. We have
  // to kick it ourselves. For client-initiated/transport drops, auto
  // reconnection already covers us.
  aiSocket.on("disconnect", (reason) => {
    log("disconnected:", reason);
    if (reason === "io server disconnect") {
      // Slight delay so we don't tight-loop if the server is unhappy.
      setTimeout(() => {
        if (!aiSocket.connected) aiSocket.connect();
      }, 500);
    }
  });

  aiSocket.on("connect", () => log("connected", aiSocket.id));
  aiSocket.on("connect_error", (err) => log("connect_error:", err.message));
  aiSocket.io.on("reconnect_attempt", (n) => log("reconnect_attempt", n));
  aiSocket.io.on("reconnect", (n) => log("reconnected after", n, "attempts"));
  aiSocket.io.on("reconnect_failed", () => log("reconnect_failed"));
  aiSocket.io.on("error", (e) => log("manager error:", e));

  // If the browser tab becomes visible again and we're disconnected, try
  // immediately instead of waiting for the next backoff tick.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !aiSocket.connected) {
      log("tab visible -> reconnect");
      aiSocket.connect();
    }
  });

  // When the network comes back, reconnect right away.
  window.addEventListener("online", () => {
    if (!aiSocket.connected) {
      log("network online -> reconnect");
      aiSocket.connect();
    }
  });
}

export default aiSocket;
