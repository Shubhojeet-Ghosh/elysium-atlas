"use client";

import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { v4 as uuidv4 } from "uuid";
import { ArrowUp } from "lucide-react";
import aiSocket from "@/lib/aiSocket";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  addMessageToCapturedSession,
  markSessionMessagesAsRead,
  updateConversationLogLastMessage,
  type ConversationMessage,
} from "@/store/reducers/agentSlice";
import { formatChatTimestamp } from "@/utils/formatDate";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { createMarkdownComponents } from "@/utils/markdownComponents";

const conversationMarkdownComponents = createMarkdownComponents({
  codeTextColor: "#1e2939",
});

// ─── Chat body ────────────────────────────────────────────────────────────────

export default function ConversationChatBody({
  chat_session_id,
  agent_id,
  isVisible = true,
}: {
  chat_session_id: string;
  agent_id: string;
  isVisible?: boolean;
}) {
  const dispatch = useAppDispatch();
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Always holds the latest isVisible value — avoids stale closures in socket handlers
  const isVisibleRef = useRef(isVisible);
  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  // Read this session's conversation_chain from Redux
  const conversation_chain = useAppSelector(
    (state) =>
      state.agent.captured_sessions.find(
        (s) => s.chat_session_id === chat_session_id,
      )?.conversation_chain ?? [],
  );

  // Mirror chain in a ref so the isVisible effect can read it without re-running
  const conversationChainRef = useRef(conversation_chain);
  useEffect(() => {
    conversationChainRef.current = conversation_chain;
  }, [conversation_chain]);

  // Index of the first unread message when the panel was last opened
  // (-1 = no separator). Stays set until the panel collapses again.
  const [separatorIndex, setSeparatorIndex] = useState(-1);
  // Mirror of separatorIndex in a ref — lets the socket handler read it without stale closure
  const separatorIndexRef = useRef(-1);
  useEffect(() => {
    separatorIndexRef.current = separatorIndex;
  }, [separatorIndex]);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation_chain]);

  // When panel re-expands, jump instantly to bottom (no animation)
  // and mark all unread messages as read
  useEffect(() => {
    if (isVisible) {
      // Snapshot the first unread position BEFORE marking as read so the
      // separator stays visible while the panel is open (WhatsApp-style)
      const firstUnread = conversationChainRef.current.findIndex(
        (m) => m.is_read === false,
      );
      setSeparatorIndex(firstUnread); // -1 if no unread → no separator
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      dispatch(markSessionMessagesAsRead(chat_session_id));
    } else {
      // Clear separator when panel collapses so next re-open gets a fresh one
      setSeparatorIndex(-1);
    }
  }, [isVisible]);

  // Listen for incoming visitor messages on this session
  useEffect(() => {
    const handleMessageFromVisitor = (data: {
      agent_id: string;
      chat_session_id: string;
      message: string;
      sender: string;
    }) => {
      if (data.chat_session_id !== chat_session_id) return;

      const visitorMsgAt = new Date().toISOString();

      dispatch(
        addMessageToCapturedSession({
          chat_session_id,
          message: {
            message_id: uuidv4(),
            role: "user",
            content: data.message,
            created_at: visitorMsgAt,
            is_read: isVisibleRef.current,
          },
        }),
      );

      dispatch(
        updateConversationLogLastMessage({
          chat_session_id,
          last_message: data.message,
          last_message_at: visitorMsgAt,
        }),
      );

      // If the panel is open and no separator is showing yet, place one at
      // the index this new message is about to occupy (WhatsApp-style)
      if (isVisibleRef.current && separatorIndexRef.current === -1) {
        setSeparatorIndex(conversationChainRef.current.length);
      }
    };

    aiSocket.on("message_from_visitor", handleMessageFromVisitor);
    return () => {
      aiSocket.off("message_from_visitor", handleMessageFromVisitor);
    };
  }, [chat_session_id, dispatch]);

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

      dispatch(
        updateConversationLogLastMessage({
          chat_session_id,
          last_message: msg,
          last_message_at: newMessage.created_at,
        }),
      );

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
              {conversation_chain.map((msg, index) => {
                const isTeamMember =
                  msg.role === "human" || msg.role === "agent";
                return (
                  <Fragment key={msg.message_id}>
                    {index === separatorIndex && (
                      <div
                        key={`sep-${msg.message_id}`}
                        className="flex items-center gap-2 my-1 px-1"
                      >
                        <div className="flex-1 h-px bg-serene-purple/40" />
                        <span className="text-[10px] font-semibold text-serene-purple uppercase tracking-wider">
                          New
                        </span>
                        <div className="flex-1 h-px bg-serene-purple/40" />
                      </div>
                    )}
                    <div
                      className={`flex flex-col gap-0.5 ${
                        isTeamMember ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 text-[13px] leading-relaxed font-[500] break-words ${
                          isTeamMember
                            ? "bg-serene-purple text-white rounded-2xl rounded-br-sm"
                            : "bg-pure-mist text-gray-800 dark:text-gray-900 rounded-2xl rounded-bl-sm"
                        }`}
                      >
                        <div className="prose prose-sm max-w-none [&_*]:text-inherit [&_a]:underline [&_a]:cursor-pointer">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={conversationMarkdownComponents}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-pure-mist px-1">
                        {formatChatTimestamp(msg.created_at)}
                      </span>
                    </div>
                  </Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Input area ── */}
      <div className="flex-shrink-0 pt-[6px] pb-[18px] px-[12px]">
        <div className="pr-[10px] relative flex items-end gap-2 bg-white dark:bg-pure-mist border border-gray-200 dark:border-black rounded-xl shadow-sm transition-all py-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="font-[500] w-full py-1.5 bg-transparent text-[13px] text-gray-800 dark:text-deep-onyx placeholder-gray-400 focus:outline-none resize-none overflow-y-auto pl-3"
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
