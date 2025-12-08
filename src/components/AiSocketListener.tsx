"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import { connectAiSocket, disconnectAiSocket } from "@/lib/aiSocket";

/**
 * Global AI socket listener.
 * Mount it once per page to initialize the socket and handle events.
 */
export default function AiSocketListener() {
  useEffect(() => {
    const sessionToken = Cookies.get("elysium_atlas_session_token");
    let args = {};
    if (sessionToken) {
      args = { elysium_atlas_session_token: sessionToken };
    }
    const socket = connectAiSocket(args);

    return () => {
      disconnectAiSocket();
    };
  }, []);

  // No UI to render
  return null;
}
