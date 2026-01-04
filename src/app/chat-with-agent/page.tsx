"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setAgentId,
  setChatSessionId,
  setTheme,
  setConversationChain,
  setVisitorAt,
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
  const sourceParam = searchParams.get("source");

  useEffect(() => {
    if (agentIdParam) {
      dispatch(setAgentId(agentIdParam));
    } else {
      // Generate a random UUID if agent_id is not provided or falsy
      const generatedAgentId = uuidv4();
      dispatch(setAgentId(generatedAgentId));
    }
  }, [agentIdParam, dispatch]);

  useEffect(() => {
    if (chatSessionIdParam) {
      dispatch(setChatSessionId(chatSessionIdParam));
    } else {
      // Generate a random UUID with "un-" prefix if chat_session_id is not provided or falsy
      const generatedSessionId = `un-${uuidv4()}`;
      dispatch(setChatSessionId(generatedSessionId));
    }
  }, [chatSessionIdParam, dispatch]);

  useEffect(() => {
    const theme = themeParam === "dark" ? "dark" : "light";
    dispatch(setTheme(theme));
  }, [themeParam, dispatch]);

  useEffect(() => {
    if (sourceParam) {
      dispatch(setVisitorAt(sourceParam));
    } else {
      dispatch(setVisitorAt(null));
    }
  }, [sourceParam, dispatch]);

  return agent_id && chat_session_id && <AgentChatSpace />;
}
