"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAppDispatch } from "@/store";
import {
  setAgentId,
  setChatSessionId,
  setTheme,
  setVisitorAt,
  setIsAgentOpen,
  resetAgentChat,
} from "@/store/reducers/agentChatSlice";
import AgentChatSpace from "@/components/ElysiumAtlas/AgentChatSpace";

export default function ChatWithAgent() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  // Local state to control when the component is ready to render
  const [isReady, setIsReady] = useState(false);

  const agentIdParam = searchParams.get("agent_id");
  const chatSessionIdParam = searchParams.get("chat_session_id");
  const themeParam = searchParams.get("theme") as "light" | "dark" | null;
  const sourceParam = searchParams.get("source");

  // Initialize on mount - reset first, then set all values
  useEffect(() => {
    // Reset any existing state first
    dispatch(resetAgentChat());

    // Set agent_id
    const agentId = agentIdParam || uuidv4();
    dispatch(setAgentId(agentId));

    // Set chat_session_id
    const sessionId = chatSessionIdParam || `un-${uuidv4()}`;
    dispatch(setChatSessionId(sessionId));

    // Set theme
    const theme = themeParam === "dark" ? "dark" : "light";
    dispatch(setTheme(theme));

    // Set visitor source
    dispatch(setVisitorAt(sourceParam || null));

    // Mark as ready to render
    setIsReady(true);

    // Cleanup on unmount - reset state
    return () => {
      dispatch(resetAgentChat());
    };
  }, [agentIdParam, chatSessionIdParam, themeParam, sourceParam, dispatch]);

  // Handle open_chat message from parent
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "open_chat") {
        dispatch(setIsAgentOpen(true));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [dispatch]);

  // Only render when ready
  return isReady ? <AgentChatSpace /> : null;
}
