"use client";

import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  setChatSessionId,
  setConversationChain,
} from "@/store/reducers/agentChatSlice";
import fastApiAxios from "@/utils/fastapi_axios";

interface NewChatComponentProps {
  onNewChat?: () => void;
}

export default function NewChatComponent({ onNewChat }: NewChatComponentProps) {
  const { agent_id, chat_session_id } = useAppSelector(
    (state) => state.agentChat,
  );
  const dispatch = useAppDispatch();

  const handleNewChat = async () => {
    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/rotate-conversation-id",
        {
          agent_id,
          chat_session_id,
        },
      );

      const newSessionId = response.data?.chat_session_id;
      if (newSessionId) {
        dispatch(setChatSessionId(newSessionId));
      }
      dispatch(setConversationChain([]));
    } catch (error) {
      console.error("Failed to start new chat:", error);
    } finally {
      onNewChat?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-deep-onyx rounded-xl shadow-xl z-50 overflow-hidden"
    >
      <div className="p-1.5">
        <button
          onClick={handleNewChat}
          className="flex items-center w-full px-3 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-all duration-200"
        >
          <Plus className="mr-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span>New Chat</span>
        </button>
      </div>
    </motion.div>
  );
}
