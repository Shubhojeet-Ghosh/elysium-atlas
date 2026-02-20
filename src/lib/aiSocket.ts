import { io, Socket } from "socket.io-client";

let isIntentionalDisconnect = false;
type SocketConnectionArgs = {
  elysium_atlas_session_token?: string;
};
const BASE_RECONNECTION_DELAY = 1000;
const MAX_RECONNECTION_DELAY = 15000;
const CONNECTION_TIMEOUT = 20000;

// Create the socket once; don't auto-connect and don't send auth yet
const aiSocket: Socket = io(
  process.env.NEXT_PUBLIC_FASTAPI_SERVER_BASE_URL ||
    "https://ai.sgdevstudio.in",
  {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: BASE_RECONNECTION_DELAY,
    reconnectionDelayMax: MAX_RECONNECTION_DELAY,
    randomizationFactor: 0.5,
    timeout: CONNECTION_TIMEOUT,
    forceNew: false,
    multiplex: true,
  }
);

// --- Event listeners ---
aiSocket.on("connect", () => {
  console.log("AI socket connected:", aiSocket.id);
});

aiSocket.on("disconnect", (reason) => {
  console.log("AI socket disconnected:", reason);
  if (isIntentionalDisconnect) {
    isIntentionalDisconnect = false;
    return;
  }
  console.warn("Socket disconnected unexpectedly; auto-reconnect is active.");
});

aiSocket.on("connect_error", (error) => {
  console.error("AI socket connection error:", error.message);
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
export const connectAiSocket = (args: SocketConnectionArgs = {}): Socket => {
  if (args && args.elysium_atlas_session_token) {
    aiSocket.auth = { token: args.elysium_atlas_session_token };
  }

  isIntentionalDisconnect = false;
  if (!aiSocket.connected) {
    aiSocket.connect();
  }
  return aiSocket;
};

/**
 * Wait for socket connection and reject if timeout is reached.
 */
export const waitForAiSocketConnection = (
  timeoutMs = CONNECTION_TIMEOUT
): Promise<Socket> => {
  const socket = connectAiSocket();
  if (socket.connected) {
    return Promise.resolve(socket);
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      socket.off("connect", onConnect);
      reject(lastError ?? new Error("Socket connection timeout"));
    }, timeoutMs);
    let lastError: Error | null = null;

    const onConnect = () => {
      clearTimeout(timeoutId);
      socket.off("connect_error", onError);
      resolve(socket);
    };

    const onError = (error: Error) => {
      lastError = error;
    };

    socket.once("connect", onConnect);
    socket.once("connect_error", onError);
  });
};

/**
 * Disconnect the AI socket if it's connected.
 * Marks as intentional to prevent auto-reconnection.
 */
export const disconnectAiSocket = (): void => {
  if (aiSocket.connected || aiSocket.active) {
    isIntentionalDisconnect = true;
    aiSocket.disconnect();
  }
};

/**
 * Check if socket is connected.
 */
export const isAiSocketHealthy = (): boolean => {
  return aiSocket.connected;
};

/**
 * Force reconnection (useful for handling auth token updates)
 */
export const reconnectAiSocket = (args: SocketConnectionArgs = {}): Socket => {
  disconnectAiSocket();
  setTimeout(() => {
    connectAiSocket(args);
  }, 100);
  return aiSocket;
};

// Cleanup on page unload (browser only)
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    isIntentionalDisconnect = true;
    if (aiSocket.connected) {
      aiSocket.disconnect();
    }
  });

  // Handle visibility change to maintain connection health
  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "visible" &&
      !aiSocket.connected &&
      !isIntentionalDisconnect
    ) {
      console.log("Page became visible, checking connection...");
      connectAiSocket();
    }
  });
}

export default aiSocket;
