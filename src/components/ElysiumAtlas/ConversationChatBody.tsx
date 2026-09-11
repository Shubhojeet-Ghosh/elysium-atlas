"use client";

import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { v4 as uuidv4 } from "uuid";
import { ArrowUp } from "lucide-react";
import aiSocket from "@/lib/aiSocket";
import { useAppSelector, useAppDispatch, store } from "@/store";
import {
  addMessageToCapturedSession,
  markCapturedMessageAsRead,
  updateConversationLogLastMessage,
  markConversationLogAsRead,
  incrementConversationLogUnread,
  type ConversationMessage,
  type CapturedSessionMode,
} from "@/store/reducers/agentSlice";
import {
  isVisitorMessageUnread,
  isMonitorMessageUnread,
  findFirstUnreadSeparatorIndex,
  resolveMarkReadMessageId,
  isToolCallMessage,
  normalizeConversationMessage,
} from "@/utils/conversationMessageUtils";
import { useMarkMessagesReadWhenVisible } from "@/hooks/useMarkMessagesReadWhenVisible";
import ConversationMessageBubble from "@/components/ElysiumAtlas/ConversationMessageBubble";
import ConversationToolCallCard from "@/components/ElysiumAtlas/ConversationToolCallCard";
import {
  useChatScrollToUnreadOrBottom,
  AGENT_UNREAD_SEPARATOR_VIEWPORT_RATIO,
} from "@/hooks/useChatScrollToUnreadOrBottom";
// ─── Chat body ────────────────────────────────────────────────────────────────

export default function ConversationChatBody({
  chat_session_id,
  agent_id,
  conversationMode = "monitor",
  isVisible = true,
  pauseAgentMirror = false,
  showToolCalls = false,
}: {
  chat_session_id: string;
  agent_id: string;
  conversationMode?: CapturedSessionMode;
  isVisible?: boolean;
  pauseAgentMirror?: boolean;
  showToolCalls?: boolean;
}) {
  const isMonitorMode = conversationMode === "monitor";
  const dispatch = useAppDispatch();
  const userID = useAppSelector((state) => state.userProfile.userID);
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const separatorElRef = useRef<HTMLDivElement>(null);
  // Always holds the latest isVisible value- avoids stale closures in socket handlers
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
  const messagingUnreadCount = useAppSelector(
    (state) =>
      state.agent.team_member_conversation_logs.find(
        (l) => l.chat_session_id === chat_session_id,
      )?.unread_count ?? 0,
  );

  // Mirror chain in a ref so the isVisible effect can read it without re-running
  const conversationChainRef = useRef(conversation_chain);
  useEffect(() => {
    conversationChainRef.current = conversation_chain;
  }, [conversation_chain]);

  // Index of the first unread message when the panel was last opened
  // (-1 = no separator). Stays set until the panel collapses again.
  const [separatorIndex, setSeparatorIndex] = useState(-1);
  // Mirror of separatorIndex in a ref- lets the socket handler read it without stale closure
  const separatorIndexRef = useRef(-1);
  useEffect(() => {
    separatorIndexRef.current = separatorIndex;
  }, [separatorIndex]);

  const handleMessageMarked = useCallback(
    (messageId: string, readAt: string, mongoId?: string | null) => {
      dispatch(
        markCapturedMessageAsRead({
          chat_session_id,
          message_id: messageId,
          _id: mongoId ?? null,
          read_at: readAt,
        }),
      );

      const chain =
        store
          .getState()
          .agent.captured_sessions.find(
            (s) => s.chat_session_id === chat_session_id,
          )?.conversation_chain ?? [];

      if (!chain.some(isVisitorMessageUnread)) {
        dispatch(markConversationLogAsRead(chat_session_id));
        setSeparatorIndex(-1);
        separatorIndexRef.current = -1;
      }
    },
    [chat_session_id, dispatch],
  );

  const { markVisible: markMessageVisible, reset: resetReadReceipts } =
    useMarkMessagesReadWhenVisible({
      enabled: isVisible,
      agent_id,
      chat_session_id,
      read_by: userID,
      onMessageMarked: handleMessageMarked,
    });

  const markMessageVisibleRef = useRef(markMessageVisible);
  useEffect(() => {
    markMessageVisibleRef.current = markMessageVisible;
  }, [markMessageVisible]);

  const queueMarkMessageRead = useCallback((message: ConversationMessage) => {
    const markReadId = resolveMarkReadMessageId(message);
    if (!markReadId) return;
    markMessageVisibleRef.current(message.message_id, message._id ?? markReadId);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      resetReadReceipts();
    }
  }, [isVisible, resetReadReceipts]);

  useEffect(() => {
    if (isVisible) return;

    const chain =
      store
        .getState()
        .agent.captured_sessions.find(
          (s) => s.chat_session_id === chat_session_id,
        )?.conversation_chain ?? [];
    if (!chain.some(isVisitorMessageUnread)) {
      dispatch(markConversationLogAsRead(chat_session_id));
    }
  }, [isVisible, chat_session_id, dispatch]);

  const hasUnreadMessages =
    separatorIndex >= 0 ||
    findFirstUnreadSeparatorIndex(conversation_chain, messagingUnreadCount) !==
      -1;

  const { scrollToBottomOnSend } = useChatScrollToUnreadOrBottom({
    active: isVisible,
    ready: conversation_chain.length > 0,
    conversationLength: conversation_chain.length,
    separatorIndex,
    hasUnreadMessages,
    scrollContainerRef,
    separatorElRef,
    messagesEndRef,
    separatorViewportRatio: AGENT_UNREAD_SEPARATOR_VIEWPORT_RATIO,
  });

  // Snapshot "New" separator when panel opens or history finishes loading
  useEffect(() => {
    if (!isVisible) {
      setSeparatorIndex(-1);
      separatorIndexRef.current = -1;
      resetReadReceipts();
      return;
    }

    if (separatorIndexRef.current !== -1) return;

    const firstUnread = findFirstUnreadSeparatorIndex(
      conversation_chain,
      messagingUnreadCount,
    );
    if (firstUnread === -1) return;

    separatorIndexRef.current = firstUnread;
    setSeparatorIndex(firstUnread);
  }, [
    isVisible,
    conversation_chain,
    chat_session_id,
    messagingUnreadCount,
    resetReadReceipts,
  ]);

  // Clear stale separator / log unread once all visitor messages are read
  useEffect(() => {
    if (!isVisible) return;

    const stillUnread = conversation_chain.some(isVisitorMessageUnread);
    if (stillUnread) return;

    if (separatorIndexRef.current !== -1) {
      setSeparatorIndex(-1);
      separatorIndexRef.current = -1;
    }
    if (messagingUnreadCount > 0) {
      dispatch(markConversationLogAsRead(chat_session_id));
    }
  }, [
    isVisible,
    conversation_chain,
    messagingUnreadCount,
    chat_session_id,
    dispatch,
  ]);

  // Mark visible unread messages when panel is open (incl. after history load)
  useEffect(() => {
    if (!isVisible) return;

    const unread = conversation_chain.filter((msg) =>
      isMonitorMode ? isMonitorMessageUnread(msg) : isVisitorMessageUnread(msg),
    );
    if (unread.length === 0) return;

    const rafId = requestAnimationFrame(() => {
      unread.forEach((msg) => queueMarkMessageRead(msg));
    });

    return () => cancelAnimationFrame(rafId);
  }, [isVisible, conversation_chain, isMonitorMode, queueMarkMessageRead]);

  // Listen for incoming visitor and agent messages on this session
  useEffect(() => {
    const appendMessage = (
      message: ConversationMessage,
      lastMessage: string,
      lastMessageAt: string,
    ) => {
      dispatch(
        addMessageToCapturedSession({
          chat_session_id,
          message,
        }),
      );

      dispatch(
        updateConversationLogLastMessage({
          chat_session_id,
          last_message: lastMessage,
          last_message_at: lastMessageAt,
        }),
      );
    };

    const handleMessageFromVisitor = (data: {
      agent_id: string;
      chat_session_id: string;
      message: string;
      sender: string;
      message_id?: string;
      _id?: string;
      created_at?: string;
    }) => {
      if (data.chat_session_id !== chat_session_id) return;

      const visitorMsgAt = data.created_at ?? new Date().toISOString();

      appendMessage(
        {
          message_id: data.message_id ?? data._id ?? uuidv4(),
          _id: data._id,
          role: "user",
          content: data.message,
          created_at: visitorMsgAt,
        },
        data.message,
        visitorMsgAt,
      );

      // When the panel is not visible, treat this as unread for history
      if (!isVisibleRef.current) {
        dispatch(incrementConversationLogUnread(chat_session_id));
      }

      // If the panel is open and no separator is showing yet, place one at
      // the index this new message is about to occupy (WhatsApp-style)
      if (isVisibleRef.current && separatorIndexRef.current === -1) {
        setSeparatorIndex(conversationChainRef.current.length);
      }

      if (isVisibleRef.current && data._id) {
        requestAnimationFrame(() => {
          markMessageVisibleRef.current(
            data.message_id ?? data._id!,
            data._id ?? null,
          );
        });
      }
    };

    const handleMessageFromAgent = (data: {
      agent_id: string;
      chat_session_id: string;
      message?: string;
      content?: string;
      sender: string;
      message_id?: string;
      _id?: string;
      role?: string;
      created_at?: string;
    }) => {
      if (data.chat_session_id !== chat_session_id) return;
      if (pauseAgentMirror) return;
      if (data.role === "tool") return;

      const agentMsgAt = data.created_at ?? new Date().toISOString();
      const content = data.content ?? data.message ?? "";

      appendMessage(
        {
          message_id: data.message_id ?? data._id ?? uuidv4(),
          _id: data._id,
          role: (data.role as "user" | "agent" | "human") ?? "agent",
          content,
          created_at: agentMsgAt,
        },
        content,
        agentMsgAt,
      );

      if (isVisibleRef.current && isMonitorMode && data._id) {
        requestAnimationFrame(() => {
          markMessageVisibleRef.current(
            data.message_id ?? data._id!,
            data._id ?? null,
          );
        });
      }
    };

    const handleMessageFromTeamMember = (data: {
      agent_id: string;
      chat_session_id: string;
      message: string;
      sender: string;
      conversation_mode?: string;
      message_id?: string;
      _id?: string;
      role?: string;
      team_member_id?: string;
      created_at?: string;
    }) => {
      if (data.chat_session_id !== chat_session_id) return;
      if (!isMonitorMode) return;

      const teamMsgAt = data.created_at ?? new Date().toISOString();
      const content = data.message ?? "";

      appendMessage(
        {
          message_id: data.message_id ?? data._id ?? uuidv4(),
          _id: data._id,
          role: (data.role as "user" | "agent" | "human") ?? "human",
          content,
          created_at: teamMsgAt,
        },
        content,
        teamMsgAt,
      );

      if (isVisibleRef.current && data._id) {
        requestAnimationFrame(() => {
          markMessageVisibleRef.current(
            data.message_id ?? data._id!,
            data._id ?? null,
          );
        });
      }
    };

    const handleToolCallFromAgent = (data: Record<string, unknown>) => {
      if (String(data.chat_session_id ?? "") !== chat_session_id) return;
      if (!isMonitorMode || pauseAgentMirror) return;

      dispatch(
        addMessageToCapturedSession({
          chat_session_id,
          message: normalizeConversationMessage({
            ...data,
            role: "tool",
          }),
        }),
      );
    };

    aiSocket.on("message_from_visitor", handleMessageFromVisitor);
    aiSocket.on("message_from_agent", handleMessageFromAgent);
    aiSocket.on("message_from_team_member", handleMessageFromTeamMember);
    aiSocket.on("tool_call_from_agent", handleToolCallFromAgent);
    return () => {
      aiSocket.off("message_from_visitor", handleMessageFromVisitor);
      aiSocket.off("message_from_agent", handleMessageFromAgent);
      aiSocket.off("message_from_team_member", handleMessageFromTeamMember);
      aiSocket.off("tool_call_from_agent", handleToolCallFromAgent);
    };
  }, [chat_session_id, dispatch, isMonitorMode, pauseAgentMirror]);

  const handleSendMessage = useCallback(
    (message?: string) => {
      if (isMonitorMode) return;

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

      scrollToBottomOnSend();

      // Emit socket- payload matches spec: { agent_id, chat_session_id, message }
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
          from_agent: true,
        }),
      );

      setInputValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    [inputValue, isMonitorMode, agent_id, chat_session_id, dispatch, scrollToBottomOnSend],
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
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        <div className="flex flex-col min-h-full px-3 py-3">
          {/* Spacer pushes messages to the bottom, just like MainChatSpace */}
          <div className="flex-grow" />

          {conversation_chain.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <span className="text-[13px] text-gray-400 dark:text-gray-500 text-center">
                No messages yet.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {conversation_chain.map((msg, index) => {
                if (isToolCallMessage(msg) && !showToolCalls) return null;

                const isTeamMember =
                  msg.role === "human" || msg.role === "agent";
                const needsReadReceipt = isMonitorMode
                  ? isMonitorMessageUnread(msg)
                  : isVisitorMessageUnread(msg);

                let isFirstToolInGroup = false;
                let isLastToolInGroup = false;
                if (isToolCallMessage(msg)) {
                  const previousVisible = conversation_chain
                    .slice(0, index)
                    .reverse()
                    .find(
                      (item) =>
                        !isToolCallMessage(item) || showToolCalls,
                    );
                  const nextVisible = conversation_chain
                    .slice(index + 1)
                    .find(
                      (item) =>
                        !isToolCallMessage(item) || showToolCalls,
                    );
                  isFirstToolInGroup =
                    !previousVisible || !isToolCallMessage(previousVisible);
                  isLastToolInGroup =
                    !nextVisible || !isToolCallMessage(nextVisible);
                }

                return (
                  <Fragment key={msg._id ?? msg.message_id}>
                    {index === separatorIndex && (
                      <div
                        ref={separatorElRef}
                        className="flex items-center gap-2 my-1 px-1"
                      >
                        <div className="flex-1 h-px bg-serene-purple/40" />
                        <span className="text-[10px] font-semibold text-serene-purple uppercase tracking-wider">
                          New
                        </span>
                        <div className="flex-1 h-px bg-serene-purple/40" />
                      </div>
                    )}
                    {isToolCallMessage(msg) ? (
                      <ConversationToolCallCard
                        message={msg}
                        isFirstInGroup={isFirstToolInGroup}
                        isLastInGroup={isLastToolInGroup}
                      />
                    ) : (
                      <ConversationMessageBubble
                        message={msg}
                        isTeamMember={isTeamMember}
                        needsReadReceipt={needsReadReceipt}
                        isVisible={isVisible}
                        scrollContainerRef={scrollContainerRef}
                        onMarkVisible={markMessageVisible}
                      />
                    )}
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
        <div
          className={`pr-[10px] relative flex items-end gap-2 bg-white dark:bg-pure-mist border border-gray-200 dark:border-black rounded-xl shadow-sm transition-all py-2 ${
            isMonitorMode ? "opacity-70" : ""
          }`}
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isMonitorMode
                ? "Monitoring only — take over to reply to this visitor"
                : "Type a message…"
            }
            disabled={isMonitorMode}
            className="font-[500] w-full py-1.5 bg-transparent text-[13px] text-gray-800 dark:text-deep-onyx placeholder-gray-400 focus:outline-none resize-none overflow-y-auto pl-3 disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-400"
            rows={2}
            style={{ minHeight: "60px", maxHeight: "100px" }}
          />
          <button
            type="button"
            className={`p-1.5 rounded-lg transition-all duration-300 shadow-sm mb-[-2px] mr-[-2px] ${
              isMonitorMode || inputValue.trim() === ""
                ? "cursor-not-allowed bg-serene-purple/30 text-white/60"
                : "cursor-pointer bg-serene-purple text-white"
            }`}
            onClick={() => handleSendMessage()}
            disabled={isMonitorMode || inputValue.trim() === ""}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
