import { io } from "socket.io-client";

// Create the socket once; don't auto-connect and don't send auth yet
const aiSocket = io(
  process.env.NEXT_PUBLIC_FASTAPI_SERVER_BASE_URL ||
    "https://ai.sgdevstudio.in",
  {
    path: "/socket.io",
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
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
  console.error("AI socket connection error:", error);
});

/**
 * Connect the AI socket if it's not already connected.
 */
export const connectAiSocket = (args: any = {}) => {
  if (!aiSocket.connected) {
    if (args && args.elysium_atlas_session_token) {
      aiSocket.auth = { token: args.elysium_atlas_session_token };
    }
    aiSocket.connect();
  }
  return aiSocket;
};

/**
 * Disconnect the AI socket if it's connected.
 */
export const disconnectAiSocket = () => {
  if (aiSocket.connected) {
    aiSocket.disconnect();
  }
};

export default aiSocket;
