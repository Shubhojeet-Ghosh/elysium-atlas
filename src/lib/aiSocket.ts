import { io, Socket } from "socket.io-client";

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECTION_DELAY = 1000;
const MAX_RECONNECTION_DELAY = 30000;

type SocketConnectArgs = {
  elysium_atlas_session_token?: string;
};

const getTokenFromCookie = (cookieName: string): string | null => {
  if (typeof document === "undefined") {
    return null;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${cookieName}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() ?? null;
  }
  return null;
};

const getSessionToken = (args: SocketConnectArgs = {}): string | null => {
  if (args.elysium_atlas_session_token) {
    return args.elysium_atlas_session_token;
  }
  if (typeof window === "undefined") {
    return null;
  }
  return (
    localStorage.getItem("elysium_atlas_session_token") ||
    localStorage.getItem("tempToken") ||
    getTokenFromCookie("elysium_atlas_session_token")
  );
};

// Create the socket once; don't auto-connect and don't send auth yet
const aiSocket: Socket = io(
  process.env.NEXT_PUBLIC_FASTAPI_SERVER_BASE_URL ||
    "https://ai.sgdevstudio.in",
  {
    path: "/socket.io",
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: BASE_RECONNECTION_DELAY,
    reconnectionDelayMax: MAX_RECONNECTION_DELAY,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
  }
);

// --- Event listeners ---
aiSocket.on("connect", () => {
  console.log("AI socket connected:", aiSocket.id);
});

aiSocket.on("disconnect", (reason) => {
  console.log("AI socket disconnected:", reason);
});

aiSocket.on("connect_error", (error) => {
  console.error("AI socket connection error:", error.message);
});

// Refresh token before every reconnect attempt to avoid stale auth.
aiSocket.io.on("reconnect_attempt", () => {
  const freshToken = getSessionToken();
  if (freshToken) {
    aiSocket.auth = { token: freshToken };
  }
});

aiSocket.on("reconnect_failed", () => {
  console.error("Reconnection failed after maximum attempts");
});

aiSocket.on("reconnect", (attemptNumber) => {
  console.log(`Successfully reconnected after ${attemptNumber} attempts`);
});

// Handle errors during communication
aiSocket.on("error", (error) => {
  console.error("AI socket error:", error);
});

/**
 * Connect the AI socket if it's not already connected.
 */
export const connectAiSocket = (args: SocketConnectArgs = {}): Socket => {
  const token = getSessionToken(args);
  if (token) {
    aiSocket.auth = { token };
  }

  if (!aiSocket.connected) {
    aiSocket.connect();
  }
  return aiSocket;
};

/**
 * Disconnect the AI socket if it's connected.
 */
export const disconnectAiSocket = (): void => {
  if (aiSocket.connected) {
    aiSocket.disconnect();
  }
};

/**
 * Check if socket is connected and healthy
 */
export const isAiSocketHealthy = (): boolean => {
  return aiSocket.connected;
};

/**
 * Force reconnection (useful for handling auth token updates)
 */
export const reconnectAiSocket = (args: SocketConnectArgs = {}): Socket => {
  disconnectAiSocket();
  connectAiSocket(args);
  return aiSocket;
};

// Cleanup on page unload (browser only)
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (aiSocket.connected) {
      aiSocket.disconnect();
    }
  });
}

export default aiSocket;
