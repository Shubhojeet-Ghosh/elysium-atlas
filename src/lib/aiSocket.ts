import { io, Socket } from "socket.io-client";

// Connection state tracking
let reconnectAttempts = 0;
let heartbeatInterval: NodeJS.Timeout | null = null;
let connectionTimeout: NodeJS.Timeout | null = null;
let isIntentionalDisconnect = false;
let lastPongTime = Date.now();

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECTION_DELAY = 1000;
const MAX_RECONNECTION_DELAY = 30000;
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 60000; // 60 seconds

/**
 * Calculate exponential backoff delay with jitter
 */
const getReconnectionDelay = (attemptNumber: number): number => {
  const exponentialDelay = Math.min(
    BASE_RECONNECTION_DELAY * Math.pow(2, attemptNumber),
    MAX_RECONNECTION_DELAY
  );
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 1000;
  return exponentialDelay + jitter;
};

/**
 * Clear all timers and intervals
 */
const clearTimers = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }
};

/**
 * Start heartbeat monitoring to detect stale connections
 */
const startHeartbeat = () => {
  clearTimers();

  heartbeatInterval = setInterval(() => {
    if (aiSocket.connected) {
      const timeSinceLastPong = Date.now() - lastPongTime;

      if (timeSinceLastPong > HEARTBEAT_TIMEOUT) {
        console.warn("Heartbeat timeout detected, reconnecting...");
        aiSocket.disconnect();
        aiSocket.connect();
      } else {
        aiSocket.emit("ping");
      }
    }
  }, HEARTBEAT_INTERVAL);
};

// Create the socket once; don't auto-connect and don't send auth yet
const aiSocket: Socket = io(
  process.env.NEXT_PUBLIC_FASTAPI_SERVER_BASE_URL ||
    "https://ai.sgdevstudio.in",
  {
    path: "/socket.io",
    transports: ["websocket", "polling"], // Fallback to polling if websocket fails
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: BASE_RECONNECTION_DELAY,
    reconnectionDelayMax: MAX_RECONNECTION_DELAY,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    timeout: CONNECTION_TIMEOUT,
    forceNew: false,
    multiplex: true,
  }
);

// --- Event listeners ---
aiSocket.on("connect", () => {
  console.log("AI socket connected:", aiSocket.id);
  reconnectAttempts = 0;
  lastPongTime = Date.now();
  clearTimers();
  startHeartbeat();

  // Clear connection timeout if set
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }
});

aiSocket.on("disconnect", (reason) => {
  console.log("AI socket disconnected:", reason);
  clearTimers();

  // Only attempt reconnection if not intentional
  if (!isIntentionalDisconnect) {
    if (reason === "io server disconnect") {
      // Server initiated disconnect - attempt to reconnect
      console.log("Server disconnected, attempting to reconnect...");
      setTimeout(() => {
        if (!aiSocket.connected) {
          aiSocket.connect();
        }
      }, getReconnectionDelay(reconnectAttempts));
    } else if (reason === "transport close" || reason === "transport error") {
      // Network issues - will auto-reconnect with backoff
      console.log("Network issue detected, auto-reconnecting...");
    }
  }

  isIntentionalDisconnect = false;
});

aiSocket.on("connect_error", (error) => {
  reconnectAttempts++;
  console.error(
    `AI socket connection error (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}):`,
    error.message
  );

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(
      "Max reconnection attempts reached. Please check your connection."
    );
  }
});

aiSocket.on("reconnect_attempt", (attemptNumber) => {
  console.log(`Reconnection attempt ${attemptNumber}...`);
});

aiSocket.on("reconnect_failed", () => {
  console.error("Reconnection failed after maximum attempts");
  clearTimers();
});

aiSocket.on("reconnect", (attemptNumber) => {
  console.log(`Successfully reconnected after ${attemptNumber} attempts`);
  reconnectAttempts = 0;
});

// Heartbeat response
aiSocket.on("pong", () => {
  lastPongTime = Date.now();
});

// Handle errors during communication
aiSocket.on("error", (error) => {
  console.error("AI socket error:", error);
});

/**
 * Connect the AI socket if it's not already connected.
 * Includes connection timeout handling.
 */
export const connectAiSocket = (args: any = {}): Socket => {
  if (!aiSocket.connected) {
    if (args && args.elysium_atlas_session_token) {
      aiSocket.auth = { token: args.elysium_atlas_session_token };
    }

    isIntentionalDisconnect = false;
    reconnectAttempts = 0;

    // Set connection timeout
    connectionTimeout = setTimeout(() => {
      if (!aiSocket.connected) {
        console.warn(
          "Connection timeout - socket failed to connect within timeout period"
        );
        aiSocket.disconnect();

        // Retry connection with backoff
        setTimeout(() => {
          if (!aiSocket.connected) {
            connectAiSocket(args);
          }
        }, getReconnectionDelay(1));
      }
    }, CONNECTION_TIMEOUT);

    aiSocket.connect();
  }
  return aiSocket;
};

/**
 * Disconnect the AI socket if it's connected.
 * Marks as intentional to prevent auto-reconnection.
 */
export const disconnectAiSocket = (): void => {
  if (aiSocket.connected) {
    isIntentionalDisconnect = true;
    clearTimers();
    aiSocket.disconnect();
  }
};

/**
 * Check if socket is connected and healthy
 */
export const isAiSocketHealthy = (): boolean => {
  if (!aiSocket.connected) return false;

  const timeSinceLastPong = Date.now() - lastPongTime;
  return timeSinceLastPong < HEARTBEAT_TIMEOUT;
};

/**
 * Force reconnection (useful for handling auth token updates)
 */
export const reconnectAiSocket = (args: any = {}): Socket => {
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
    clearTimers();
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
