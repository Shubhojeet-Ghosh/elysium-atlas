"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAppSelector, useAppDispatch } from "@/store";
import { ArrowUp, ArrowDown } from "lucide-react";
import { addMessage, setIsTyping } from "@/store/reducers/agentChatSlice";
import {
  connectAiSocket,
  disconnectAiSocket,
  waitForAiSocketConnection,
} from "@/lib/aiSocket";
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
import type { Socket } from "socket.io-client";

const RESPONSE_TIMEOUT_MS = 30000;

export default function MainChatSpace() {
  const {
    agent_id,
    chat_session_id,
    primary_color,
    text_color,
    placeholder_text,
    conversation_chain,
    isFetching,
    chatMode,
    isTyping,
  } = useAppSelector((state) => state.agentChat);

  const dispatch = useAppDispatch();
  const [inputValue, setInputValue] = useState("");
  const [newMessageAnimating, setNewMessageAnimating] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const streamingMessageRef = useRef("");
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(isTyping);

  // Intercept link clicks and open in parent window
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href && !link.href.startsWith("javascript:")) {
        e.preventDefault();
        window.parent.postMessage(
          { type: "navigate_link", url: link.href },
          "*" // Use specific origin in production
        );
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // Connect socket on mount, disconnect on unmount, and handle visitor connection
  const clearResponseTimeout = useCallback(() => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  }, []);

  const finalizeInterruptedResponse = useCallback(
    (reason: string) => {
      const partialMessage = streamingMessageRef.current.trim();
      clearResponseTimeout();
      isTypingRef.current = false;
      dispatch(setIsTyping(false));

      if (partialMessage) {
        dispatch(
          addMessage({
            message_id: uuidv4(),
            role: "agent",
            content: partialMessage,
            created_at: new Date().toISOString(),
          })
        );
      } else {
        dispatch(
          addMessage({
            message_id: uuidv4(),
            role: "agent",
            content:
              "Connection was interrupted while generating a response. Please resend your last message.",
            created_at: new Date().toISOString(),
          })
        );
      }

      setStreamingMessage("");
      streamingMessageRef.current = "";
      console.warn(reason);
    },
    [clearResponseTimeout, dispatch]
  );

  const startResponseTimeout = useCallback(() => {
    clearResponseTimeout();
    responseTimeoutRef.current = setTimeout(() => {
      finalizeInterruptedResponse("Response stream timed out.");
    }, RESPONSE_TIMEOUT_MS);
  }, [clearResponseTimeout, finalizeInterruptedResponse]);

  const ensureConnectedSocket = useCallback(async (): Promise<Socket> => {
    const socketInstance = socketRef.current ?? connectAiSocket();
    socketRef.current = socketInstance;

    if (socketInstance.connected) {
      return socketInstance;
    }

    return waitForAiSocketConnection();
  }, []);

  useEffect(() => {
    streamingMessageRef.current = streamingMessage;
  }, [streamingMessage]);

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    if (isFetching) {
      return;
    }

    const socketInstance = connectAiSocket();
    socketRef.current = socketInstance;

    const emitVisitorConnected = () => {
      if (!agent_id || !chat_session_id) return;
      socketInstance.emit("atlas-visitor-connected", {
        agent_id,
        chat_session_id,
      });
    };

    const handleConnect = () => {
      emitVisitorConnected();
    };

    const handleDisconnect = () => {
      if (isTypingRef.current || streamingMessageRef.current) {
        finalizeInterruptedResponse("Socket disconnected during active response.");
      } else {
        isTypingRef.current = false;
        dispatch(setIsTyping(false));
      }
    };

    const handleConnectError = () => {
      if (isTypingRef.current || streamingMessageRef.current) {
        finalizeInterruptedResponse(
          "Socket connect error occurred during active response."
        );
      } else {
        isTypingRef.current = false;
        dispatch(setIsTyping(false));
      }
    };

    const handleResponseChunk = (data: {
      chunk: string;
      done: boolean;
      full_response?: string;
      message_id?: string;
      created_at?: string;
      role?: string;
    }) => {
      if (!data.done) {
        clearResponseTimeout();
        if (isTypingRef.current) {
          isTypingRef.current = false;
          dispatch(setIsTyping(false));
        }
        setStreamingMessage((prev) => prev + data.chunk);
        return;
      }

      clearResponseTimeout();
      const finalContent =
        (data.full_response && data.full_response.trim()) ||
        streamingMessageRef.current;

      if (finalContent) {
        dispatch(
          addMessage({
            message_id: data.message_id || uuidv4(),
            role: (data.role as "user" | "agent" | "human") || "agent",
            content: finalContent,
            created_at: data.created_at || new Date().toISOString(),
          })
        );
      }

      setStreamingMessage("");
      streamingMessageRef.current = "";
      isTypingRef.current = false;
      dispatch(setIsTyping(false));
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);
    socketInstance.on("atlas_response_chunk", handleResponseChunk);

    if (socketInstance.connected) {
      emitVisitorConnected();
    } else {
      void waitForAiSocketConnection().catch(() => {
        // Initial connect will keep retrying due socket.io reconnection settings.
      });
    }

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.off("connect_error", handleConnectError);
      socketInstance.off("atlas_response_chunk", handleResponseChunk);
      clearResponseTimeout();
      disconnectAiSocket();
      socketRef.current = null;
    };
  }, [
    agent_id,
    chat_session_id,
    isFetching,
    dispatch,
    clearResponseTimeout,
    finalizeInterruptedResponse,
  ]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (newMessageAnimating) {
      const timer = setTimeout(() => setNewMessageAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [newMessageAnimating]);

  // Scroll to bottom on initial mount
  useEffect(() => {
    if (!isFetching) {
      scrollToBottom("auto");
    }
  }, [isFetching]);

  // Handle scroll to detect if user is at bottom
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isAtBottom);
  };

  const handleSendMessage = useCallback(
    async (message?: string) => {
      const msg = message || inputValue.trim();
      if (msg === "") return;

      const user_message_created_at = new Date().toISOString();

      const newMessage = {
        message_id: uuidv4(),
        role: "user" as const,
        content: msg,
        created_at: user_message_created_at,
      };

      dispatch(addMessage(newMessage));
      requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });

      setNewMessageAnimating(true);
      setInputValue("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }

      try {
        const socketInstance = await ensureConnectedSocket();

        socketInstance.emit("atlas-visitor-message", {
          agent_id,
          message: msg,
          chat_session_id,
          created_at: user_message_created_at,
        });

        if (chatMode === "ai") {
          isTypingRef.current = true;
          dispatch(setIsTyping(true));
          startResponseTimeout();
        }
      } catch (error) {
        isTypingRef.current = false;
        dispatch(setIsTyping(false));
        dispatch(
          addMessage({
            message_id: uuidv4(),
            role: "agent",
            content:
              "Unable to reach the server right now. Please check your network and try again.",
            created_at: new Date().toISOString(),
          })
        );
        console.error("Failed to send message over socket:", error);
      }
    },
    [
      inputValue,
      ensureConnectedSocket,
      agent_id,
      chat_session_id,
      chatMode,
      dispatch,
      startResponseTimeout,
    ]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);

      // Auto-resize textarea based on content
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        const scrollHeight = textareaRef.current.scrollHeight;
        const lineHeight = 20; // Approximate line height in pixels
        const maxHeight = lineHeight * 5; // Max 5 rows

        textareaRef.current.style.height = `${Math.min(
          scrollHeight,
          maxHeight
        )}px`;
      }
    },
    []
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

              {isTyping && (
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
