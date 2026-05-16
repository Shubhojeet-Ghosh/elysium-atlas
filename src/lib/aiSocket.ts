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
const aiSocket: Socket = io(SERVER_URL, {
  path: "/socket.io",
  transports: ["websocket"],
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  reconnectionAttempts: Infinity,
  auth: (cb) => cb({ token: getSessionToken() }),
});

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  aiSocket.on("connect", () => console.log("[aiSocket] connected", aiSocket.id));
  aiSocket.on("disconnect", (reason) =>
    console.log("[aiSocket] disconnected:", reason),
  );
  aiSocket.on("connect_error", (err) =>
    console.error("[aiSocket] connect_error:", err.message),
  );
}

export default aiSocket;
