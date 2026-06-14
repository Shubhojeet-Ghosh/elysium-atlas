"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  Fragment,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { useAppSelector, useAppDispatch } from "@/store";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  addMessage,
  markChatMessageAsRead,
  setIsTyping,
  setInConversationWith,
  setGeoData,
} from "@/store/reducers/agentChatSlice";
import { useAiSocket, useAiSocketEvent } from "@/hooks/useAiSocket";
import {
  isIncomingMessageUnread,
  findFirstIncomingUnreadSeparatorIndex,
} from "@/utils/conversationMessageUtils";
import { useMarkMessagesReadWhenVisible } from "@/hooks/useMarkMessagesReadWhenVisible";
import ReadReceiptMarker from "@/components/ElysiumAtlas/ReadReceiptMarker";
import { useChatScrollToUnreadOrBottom } from "@/hooks/useChatScrollToUnreadOrBottom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import ChatWelcomeMessage from "./ChatWelcomeMessage";
import SkeletonMessages from "./SkeletonMessages";
import Thinking from "./Thinking";
import ChatMessage from "./ChatMessage";
import MessageActions from "./MessageActions";
import { formatChatTimestamp } from "@/utils/formatDate";
import { markdownComponents } from "@/utils/markdownComponents";
import { getUserGeoLocationDetails } from "@/utils/geoLocationUtils";
import { isAgentDisabled, AGENT_OFFLINE_MESSAGE } from "@/utils/agentStatus";

export default function MainChatSpace() {
  const {
    agent_id,
    chat_session_id,
    primary_color,
    secondary_color,
    text_color,
    placeholder_text,
    agent_status,
    conversation_chain,
    isFetching,
    chatMode,
    isTyping,
    geoData,
    in_conversation_with,
    isAgentOpen,
  } = useAppSelector((state) => state.agentChat);

  const isOffline = isAgentDisabled(agent_status);
  const inputDisabled = isOffline;
  const inputPlaceholder = isOffline
    ? "This agent is currently offline"
    : placeholder_text;

  const dispatch = useAppDispatch();
  const [inputValue, setInputValue] = useState("");
  const [newMessageAnimating, setNewMessageAnimating] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const showOfflineAgentMessage =
    isOffline &&
    conversation_chain.length > 0 &&
    !isTyping &&
    !streamingMessage;
  const [showScrollButton, setShowScrollButton] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const separatorElRef = useRef<HTMLDivElement>(null);
  const [separatorIndex, setSeparatorIndex] = useState(-1);
  const separatorIndexRef = useRef(-1);
  /** True once we've snapshotted unread separator for this open session */
  const separatorSnapshottedRef = useRef(false);
  /** Gates read receipts until the "New" separator index is captured */
  const [separatorSnapshotReady, setSeparatorSnapshotReady] = useState(false);
  useEffect(() => {
    separatorIndexRef.current = separatorIndex;
  }, [separatorIndex]);

  // Refs read by the socket's onConnect callback so it always sees the
  // freshest values without re-subscribing.
  const joinPayloadRef = useRef({ agent_id, chat_session_id, geo_data: geoData });
  useEffect(() => {
    joinPayloadRef.current = { agent_id, chat_session_id, geo_data: geoData };
  }, [agent_id, chat_session_id, geoData]);

  // Ref-backed streaming buffer to avoid stale closures in the chunk handler.
  const streamingRef = useRef("");
  const isAgentOpenRef = useRef(isAgentOpen);
  useEffect(() => {
    isAgentOpenRef.current = isAgentOpen;
  }, [isAgentOpen]);

  const handleIncomingMessageMarked = useCallback(
    (message_id: string, readAt: string, mongoId?: string | null) => {
      dispatch(
        markChatMessageAsRead({
          message_id,
          _id: mongoId ?? null,
          read_at: readAt,
        }),
      );
    },
    [dispatch],
  );

  const { markVisible: markIncomingMessageVisible, reset: resetReadReceipts } =
    useMarkMessagesReadWhenVisible({
      enabled: !isFetching && isAgentOpen && separatorSnapshotReady,
      agent_id,
      chat_session_id,
      onMessageMarked: handleIncomingMessageMarked,
    });
  const markIncomingMessageVisibleRef = useRef(markIncomingMessageVisible);
  useEffect(() => {
    markIncomingMessageVisibleRef.current = markIncomingMessageVisible;
  }, [markIncomingMessageVisible]);

  useEffect(() => {
    if (!isAgentOpen) {
      resetReadReceipts();
    }
  }, [isAgentOpen, resetReadReceipts]);

  // Open external links in the parent window (iframe-safe).
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link && link.href && !link.href.startsWith("javascript:")) {
        e.preventDefault();
        window.parent.postMessage(
          { type: "navigate_link", url: link.href },
          "*",
        );
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // Resolve geo data once (cache in localStorage). Non-blocking: emits will
  // simply go out without geo_data if it's not ready yet.
  useEffect(() => {
    if (geoData) return;
    const GEO_CACHE_KEY = "elysium_geo_data";
    try {
      const cached = localStorage.getItem(GEO_CACHE_KEY);
      if (cached) {
        dispatch(setGeoData(JSON.parse(cached)));
        return;
      }
    } catch {
      // ignore
    }

    (async () => {
      try {
        const result = await getUserGeoLocationDetails();
        if (result?.status && result.data) {
          const d = result.data;
          const parsed = {
            country_name: d.country_name ?? null,
            country_flag: d.country_flag ?? null,
            district: d.district ?? null,
            ip: d.ip ?? null,
            time_zone: d.time_zone?.name ?? null,
          };
          dispatch(setGeoData(parsed));
          try {
            localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(parsed));
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [geoData, dispatch]);

  // Connect to the socket and (re)join the visitor session on every connect.
  // This is the ONLY place that emits atlas-visitor-connected, and it runs
  // again automatically after every reconnect — no manual race handling.
  const { emit, status } = useAiSocket({
    autoConnect: !isFetching,
    onConnect: (socket) => {
      const { agent_id, chat_session_id, geo_data } = joinPayloadRef.current;
      if (!agent_id || !chat_session_id) return;
      socket.emit("atlas-visitor-connected", {
        agent_id,
        chat_session_id,
        geo_data: geo_data ?? null,
      });
    },
  });

  useAiSocketEvent<{
    chunk: string;
    done: boolean;
    full_response?: string;
    message_id?: string;
    created_at?: string;
    role?: string;
  }>("atlas_response_chunk", (data) => {
    if (data.done) {
      const finalContent = data.full_response || streamingRef.current;
      const messageId = data.message_id || uuidv4();
      dispatch(
        addMessage({
          message_id: messageId,
          role: (data.role as "user" | "agent" | "human") || "agent",
          content: finalContent,
          created_at: data.created_at || new Date().toISOString(),
        }),
      );
      streamingRef.current = "";
      setStreamingMessage("");
      dispatch(setIsTyping(false));

      // Visitor is already in chat — mark read immediately, no "New" separator
      if (isAgentOpenRef.current) {
        requestAnimationFrame(() => {
          markIncomingMessageVisibleRef.current(messageId, null);
        });
      }
    } else {
      if (streamingRef.current === "") {
        dispatch(setIsTyping(false));
      }
      streamingRef.current += data.chunk;
      setStreamingMessage(streamingRef.current);
    }
  });

  useAiSocketEvent<{
    agent_id: string;
    chat_session_id: string;
    message: string;
    sender: string;
    in_conversation_with: string;
    _id?: string;
    message_id?: string;
    role?: string;
    created_at?: string;
  }>("visitor_message", (data) => {
    const role: "user" | "agent" | "human" =
      data.sender === "team_member"
        ? "human"
        : ((data.role as "user" | "agent" | "human") ?? "user");
    dispatch(
      addMessage({
        message_id: data.message_id ?? uuidv4(),
        _id: data._id,
        role,
        content: data.message,
        created_at: data.created_at ?? new Date().toISOString(),
      }),
    );
    dispatch(setInConversationWith(data.in_conversation_with));

    if (
      (role === "human" || role === "agent") &&
      isAgentOpenRef.current
    ) {
      const messageId = data.message_id ?? "";
      if (messageId) {
        requestAnimationFrame(() => {
          markIncomingMessageVisibleRef.current(messageId, data._id ?? null);
        });
      }
    }
  });

  useAiSocketEvent<{ in_conversation_with: string }>(
    "conversation_started",
    (data) => dispatch(setInConversationWith(data.in_conversation_with)),
  );

  useAiSocketEvent("conversation_ended", () =>
    dispatch(setInConversationWith(null)),
  );

  useEffect(() => {
    if (!isAgentOpen) {
      resetReadReceipts();
    }
  }, [isAgentOpen, resetReadReceipts]);

  const hasUnreadMessages =
    separatorIndex >= 0 ||
    findFirstIncomingUnreadSeparatorIndex(conversation_chain) !== -1;

  const { scrollToBottomOnSend } = useChatScrollToUnreadOrBottom({
    active: isAgentOpen,
    ready: !isFetching && conversation_chain.length > 0,
    conversationLength: conversation_chain.length,
    separatorIndex,
    hasUnreadMessages,
    scrollContainerRef,
    separatorElRef,
    messagesEndRef,
  });

  // Reset separator when session changes
  useEffect(() => {
    setSeparatorIndex(-1);
    separatorIndexRef.current = -1;
    separatorSnapshottedRef.current = false;
    setSeparatorSnapshotReady(false);
    resetReadReceipts();
  }, [agent_id, chat_session_id, resetReadReceipts]);

  // Snapshot before paint so mobile viewports don't mark unread messages read first
  useLayoutEffect(() => {
    if (!isAgentOpen) {
      setSeparatorIndex(-1);
      separatorIndexRef.current = -1;
      separatorSnapshottedRef.current = false;
      setSeparatorSnapshotReady(false);
      resetReadReceipts();
      return;
    }

    if (isFetching || conversation_chain.length === 0) return;
    if (separatorSnapshottedRef.current) return;

    separatorSnapshottedRef.current = true;
    const firstUnread = findFirstIncomingUnreadSeparatorIndex(conversation_chain);
    if (firstUnread !== -1) {
      separatorIndexRef.current = firstUnread;
      setSeparatorIndex(firstUnread);
    }
    setSeparatorSnapshotReady(true);
  }, [isAgentOpen, isFetching, conversation_chain, resetReadReceipts]);

  useEffect(() => {
    if (newMessageAnimating) {
      const timer = setTimeout(() => setNewMessageAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [newMessageAnimating]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight >= 100);
  };

  const handleSendMessage = useCallback(
    (message?: string) => {
      if (isOffline) return;

      const msg = (message ?? inputValue).trim();
      if (msg === "") return;

      const user_message_created_at = new Date().toISOString();

      dispatch(
        addMessage({
          message_id: uuidv4(),
          role: "user",
          content: msg,
          created_at: user_message_created_at,
        }),
      );

      scrollToBottomOnSend();

      // `emit` is connection-safe: if the socket isn't connected yet, it
      // queues the payload until the next connect. No reconnect dance needed.
      emit("atlas-visitor-message", {
        agent_id,
        message: msg,
        chat_session_id,
        created_at: user_message_created_at,
        ...(in_conversation_with ? { in_conversation_with } : {}),
      });

      if (chatMode === "ai" && !in_conversation_with) {
        dispatch(setIsTyping(true));
      }

      setNewMessageAnimating(true);
      setInputValue("");

      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
    },
    [
      inputValue,
      isOffline,
      emit,
      agent_id,
      chat_session_id,
      chatMode,
      dispatch,
      in_conversation_with,
      scrollToBottomOnSend,
    ],
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

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        const scrollHeight = textareaRef.current.scrollHeight;
        const lineHeight = 20;
        const maxHeight = lineHeight * 5;
        textareaRef.current.style.height = `${Math.min(
          scrollHeight,
          maxHeight,
        )}px`;
      }
    },
    [],
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
        onScroll={handleScroll}
      >
        <div className="flex flex-col min-h-full">
          <div className="flex-grow"></div>
          {isFetching ? (
            <SkeletonMessages />
          ) : conversation_chain.length === 0 ? (
            <ChatWelcomeMessage
              handleSendMessage={handleSendMessage}
              setInputValue={setInputValue}
            />
          ) : (
            <div className="pl-[18px] pr-[16px] font-[600] py-4 space-y-6">
              {conversation_chain.map((message, index) => (
                <Fragment key={message.message_id}>
                  {index === separatorIndex && (
                    <div
                      ref={separatorElRef}
                      className="flex items-center gap-2 my-1 px-1"
                    >
                      <div className="flex-1 h-px bg-gray-300" />
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        New
                      </span>
                      <div className="flex-1 h-px bg-gray-300" />
                    </div>
                  )}
                  {isIncomingMessageUnread(message) && message.message_id ? (
                    <ReadReceiptMarker
                      messageId={message.message_id}
                      mongoId={message._id ?? null}
                      enabled={
                        !isFetching && isAgentOpen && separatorSnapshotReady
                      }
                      scrollRootRef={scrollContainerRef}
                      onVisible={markIncomingMessageVisible}
                    >
                      <ChatMessage
                        message={message}
                        agent_id={agent_id}
                        primary_color={primary_color}
                        text_color={text_color}
                        isLast={
                          index === conversation_chain.length - 1 &&
                          !showOfflineAgentMessage
                        }
                        isAnimating={newMessageAnimating}
                      />
                    </ReadReceiptMarker>
                  ) : (
                    <ChatMessage
                      message={message}
                      agent_id={agent_id}
                      primary_color={primary_color}
                      text_color={text_color}
                      isLast={
                        index === conversation_chain.length - 1 &&
                        !showOfflineAgentMessage
                      }
                      isAnimating={newMessageAnimating}
                    />
                  )}
                </Fragment>
              ))}

              {showOfflineAgentMessage && (
                <ChatMessage
                  message={{
                    message_id: "agent-offline-notice",
                    role: "agent",
                    content: AGENT_OFFLINE_MESSAGE,
                    created_at: new Date().toISOString(),
                  }}
                  agent_id={agent_id}
                  primary_color={primary_color}
                  text_color={text_color}
                  isLast
                  isAnimating={false}
                />
              )}

              {isTyping && !in_conversation_with && (
                <div className="mt-[4px]">
                  <Thinking />
                </div>
              )}
              {streamingMessage && (
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1 min-w-0">
                    <div
                      className="text-[13px] text-gray-600 leading-relaxed prose prose-sm"
                      style={{ maxWidth: "650px", wordWrap: "break-word" }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={markdownComponents}
                      >
                        {streamingMessage}
                      </ReactMarkdown>
                    </div>
                    <div className="flex items-center justify-between w-full mt-1">
                      <MessageActions
                        messageId="streaming"
                        content={streamingMessage}
                        agent_id={agent_id}
                      />
                      <div className="text-[10px] text-gray-400">
                        {formatChatTimestamp(new Date().toISOString())}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => scrollToBottom()}
        className={`absolute bottom-18 left-1/2 transform -translate-x-1/2 p-2 rounded-full shadow-lg cursor-pointer transition-all duration-300 ${
          showScrollButton ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        style={{
          backgroundColor: primary_color,
          color: text_color,
        }}
      >
        <ArrowDown size={14} />
      </button>

      <div className="flex-shrink-0 pt-[6px] pb-[6px] px-[12px]">
        <div
          className={`pr-[10px] relative flex items-end gap-2 bg-white border border-gray-200 rounded-xl shadow-sm transition-all py-2 ${
            inputDisabled ? "opacity-60" : ""
          }`}
        >
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mb-0.5"></button>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            disabled={inputDisabled}
            className="font-[500] w-full py-1.5 bg-transparent text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none resize-none overflow-y-auto disabled:cursor-not-allowed disabled:text-gray-500"
            rows={1}
            style={{ minHeight: "40px", maxHeight: "100px" }}
          />
          <button
            className={`p-1.5 text-white bg-black rounded-lg transition-all duration-300 shadow-sm mb-[-2px] mr-[-2px] ${
              inputDisabled || inputValue.trim() === ""
                ? "cursor-not-allowed opacity-10 "
                : "cursor-pointer"
            }`}
            onClick={() => handleSendMessage()}
            disabled={inputDisabled || inputValue.trim() === ""}
            style={{ background: primary_color }}
          >
            <ArrowUp size={16} style={{ color: text_color }} />
          </button>
        </div>
      </div>
    </div>
  );
}
