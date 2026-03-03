"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { ArrowUp } from "lucide-react";
import aiSocket from "@/lib/aiSocket";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  addMessageToCapturedSession,
  type ConversationMessage,
} from "@/store/reducers/agentSlice";
import { formatChatTimestamp } from "@/utils/formatDate";

// ─── Chat body ────────────────────────────────────────────────────────────────

export default function ConversationChatBody({
  chat_session_id,
  agent_id,
}: {
  chat_session_id: string;
  agent_id: string;
}) {
  const dispatch = useAppDispatch();
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Read this session's conversation_chain from Redux
  const conversation_chain = useAppSelector(
    (state) =>
      state.agent.captured_sessions.find(
        (s) => s.chat_session_id === chat_session_id,
      )?.conversation_chain ?? [],
  );

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation_chain]);

  const handleSendMessage = useCallback(
    (message?: string) => {
      const msg = (message ?? inputValue).trim();
      if (!msg) return;

      const newMessage: ConversationMessage = {
        message_id: uuidv4(),
        role: "human",
        content: msg,
        created_at: new Date().toISOString(),
      };

      // Append to Redux conversation_chain
      dispatch(
        addMessageToCapturedSession({
          chat_session_id,
          message: newMessage,
        }),
      );

      // Emit socket — payload matches spec: { agent_id, chat_session_id, message }
      aiSocket.emit("atlas-team-member-message", {
        agent_id,
        chat_session_id,
        message: msg,
      });

      setInputValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    [inputValue, agent_id, chat_session_id, dispatch],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        const maxHeight = 20 * 5; // 5 rows max
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          maxHeight,
        )}px`;
      }
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col min-h-full px-3 py-3">
          {/* Spacer pushes messages to the bottom, just like MainChatSpace */}
          <div className="flex-grow" />

          {conversation_chain.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <span className="text-[13px] text-gray-400 dark:text-gray-500 text-center">
                No messages yet. Say hello!
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {conversation_chain.map((msg) => {
                const isTeamMember = msg.role === "human";
                return (
                  <div
                    key={msg.message_id}
                    className={`flex flex-col gap-0.5 ${isTeamMember ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 text-[13px] leading-relaxed font-[500] break-words ${
                        isTeamMember
                          ? "bg-serene-purple text-white rounded-2xl rounded-br-sm"
                          : "bg-pure-mist dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 px-1">
                      {formatChatTimestamp(msg.created_at)}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Input area ── */}
      <div className="flex-shrink-0 pt-[6px] pb-[18px] px-[12px]">
        <div className="pr-[10px] relative flex items-end gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all py-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="font-[500] w-full py-1.5 bg-transparent text-[13px] text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none resize-none overflow-y-auto pl-3"
            rows={2}
            style={{ minHeight: "60px", maxHeight: "100px" }}
          />
          <button
            className={`p-1.5 rounded-lg transition-all duration-300 shadow-sm mb-[-2px] mr-[-2px] ${
              inputValue.trim() === ""
                ? "cursor-not-allowed bg-serene-purple/30 text-white/60"
                : "cursor-pointer bg-serene-purple text-white"
            }`}
            onClick={() => handleSendMessage()}
            disabled={inputValue.trim() === ""}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
