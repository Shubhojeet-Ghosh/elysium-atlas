"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setAgentId,
  setChatSessionId,
  setTheme,
} from "@/store/reducers/agentChatSlice";
import AgentChatSpace from "@/components/ElysiumAtlas/AgentChatSpace";

export default function ChatWithAgent() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { agent_id, chat_session_id } = useAppSelector(
    (state) => state.agentChat
  );

  const agentIdParam = searchParams.get("agent_id");
  const chatSessionIdParam = searchParams.get("chat_session_id");
  const themeParam = searchParams.get("theme") as "light" | "dark" | null;

  useEffect(() => {
    if (agentIdParam) {
      dispatch(setAgentId(agentIdParam));
    } else {
      // Generate a random UUID if agent_id is not provided or falsy
      const generatedAgentId = crypto.randomUUID();
      dispatch(setAgentId(generatedAgentId));
    }
  }, [agentIdParam, dispatch]);

  useEffect(() => {
    if (chatSessionIdParam) {
      dispatch(setChatSessionId(chatSessionIdParam));
    } else {
      // Generate a random UUID with "un-" prefix if chat_session_id is not provided or falsy
      const generatedSessionId = `un-${crypto.randomUUID()}`;
      dispatch(setChatSessionId(generatedSessionId));
    }
  }, [chatSessionIdParam, dispatch]);

  useEffect(() => {
    const theme = themeParam === "dark" ? "dark" : "light";
    dispatch(setTheme(theme));
  }, [themeParam, dispatch]);

  return agent_id && chat_session_id && <AgentChatSpace />;
}
