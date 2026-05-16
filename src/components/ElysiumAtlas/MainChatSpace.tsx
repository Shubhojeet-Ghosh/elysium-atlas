"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAppSelector, useAppDispatch } from "@/store";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  addMessage,
  setIsTyping,
  setInConversationWith,
  setGeoData,
} from "@/store/reducers/agentChatSlice";
import { useAiSocket, useAiSocketEvent } from "@/hooks/useAiSocket";
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

export default function MainChatSpace() {
  const {
    agent_id,
    chat_session_id,
    primary_color,
    secondary_color,
    text_color,
    placeholder_text,
    conversation_chain,
    isFetching,
    chatMode,
    isTyping,
    geoData,
    in_conversation_with,
  } = useAppSelector((state) => state.agentChat);

  const dispatch = useAppDispatch();
  const [inputValue, setInputValue] = useState("");
  const [newMessageAnimating, setNewMessageAnimating] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Refs read by the socket's onConnect callback so it always sees the
  // freshest values without re-subscribing.
  const joinPayloadRef = useRef({ agent_id, chat_session_id, geo_data: geoData });
  useEffect(() => {
    joinPayloadRef.current = { agent_id, chat_session_id, geo_data: geoData };
  }, [agent_id, chat_session_id, geoData]);

  // Ref-backed streaming buffer to avoid stale closures in the chunk handler.
  const streamingRef = useRef("");

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

  // Re-emit the join when agent/session changes after initial connect.
  useEffect(() => {
    if (status !== "connected" || !agent_id || !chat_session_id) return;
    emit("atlas-visitor-connected", {
      agent_id,
      chat_session_id,
      geo_data: geoData ?? null,
    });
  }, [agent_id, chat_session_id, status, geoData, emit]);

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
      dispatch(
        addMessage({
          message_id: data.message_id || uuidv4(),
          role: (data.role as "user" | "agent" | "human") || "agent",
          content: finalContent,
          created_at: data.created_at || new Date().toISOString(),
        }),
      );
      streamingRef.current = "";
      setStreamingMessage("");
      dispatch(setIsTyping(false));
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
  }>("visitor_message", (data) => {
    const role: "user" | "agent" | "human" =
      data.sender === "team_member" ? "human" : "user";
    dispatch(
      addMessage({
        message_id: uuidv4(),
        role,
        content: data.message,
        created_at: new Date().toISOString(),
      }),
    );
    dispatch(setInConversationWith(data.in_conversation_with));
  });

  useAiSocketEvent<{ in_conversation_with: string }>(
    "conversation_started",
    (data) => dispatch(setInConversationWith(data.in_conversation_with)),
  );

  useAiSocketEvent("conversation_ended", () =>
    dispatch(setInConversationWith(null)),
  );

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!conversation_chain.length) return;
    const lastRole = conversation_chain[conversation_chain.length - 1]?.role;
    if (lastRole === "user" || lastRole === "human") {
      scrollToBottom();
    }
  }, [conversation_chain]);

  useEffect(() => {
    if (newMessageAnimating) {
      const timer = setTimeout(() => setNewMessageAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [newMessageAnimating]);

  useEffect(() => {
    if (!isFetching) scrollToBottom("auto");
  }, [isFetching]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight >= 100);
  };

  const handleSendMessage = useCallback(
    (message?: string) => {
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
      emit,
      agent_id,
      chat_session_id,
      chatMode,
      dispatch,
      in_conversation_with,
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
                <ChatMessage
                  key={message.message_id}
                  message={message}
                  agent_id={agent_id}
                  primary_color={primary_color}
                  text_color={text_color}
                  isLast={index === conversation_chain.length - 1}
                  isAnimating={newMessageAnimating}
                />
              ))}

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
        <div className="pr-[10px] relative flex items-end gap-2 bg-white border border-gray-200 rounded-xl shadow-sm transition-all py-2">
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mb-0.5"></button>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder_text}
            className="font-[500] w-full py-1.5 bg-transparent text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none resize-none overflow-y-auto"
            rows={1}
            style={{ minHeight: "40px", maxHeight: "100px" }}
          />
          <button
            className={`p-1.5 text-white bg-black rounded-lg transition-all duration-300 shadow-sm mb-[-2px] mr-[-2px] ${
              inputValue.trim() === ""
                ? "cursor-not-allowed opacity-10 "
                : "cursor-pointer"
            }`}
            onClick={() => handleSendMessage()}
            disabled={inputValue.trim() === ""}
            style={{ background: primary_color }}
          >
            <ArrowUp size={16} style={{ color: text_color }} />
          </button>
        </div>
      </div>
    </div>
  );
}
