"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAppSelector, useAppDispatch } from "@/store";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  addMessage,
  setIsTyping,
  resetAgentChat,
} from "@/store/reducers/agentChatSlice";
import { connectAiSocket, disconnectAiSocket } from "@/lib/aiSocket";
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
  } = useAppSelector((state) => state.agentChat);

  const dispatch = useAppDispatch();
  const [inputValue, setInputValue] = useState("");
  const [newMessageAnimating, setNewMessageAnimating] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset chat state on unmount
  useEffect(() => {
    return () => {
      dispatch(resetAgentChat());
    };
  }, [dispatch]);

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
  useEffect(() => {
    // Only connect socket after API processing is complete
    if (isFetching) {
      return;
    }

    // Connect the AI socket and store the instance
    const socketInstance = connectAiSocket();
    setSocket(socketInstance);

    const handleConnect = () => {
      // Send atlas-visitor-connected event if both agent_id and chat_session_id are truthy
      if (agent_id && chat_session_id) {
        socketInstance.emit("atlas-visitor-connected", {
          agent_id,
          chat_session_id,
        });
      }
    };

    // Listen for connection event
    socketInstance.on("connect", handleConnect);

    // Listen for response chunks
    const handleResponseChunk = (data: {
      chunk: string;
      done: boolean;
      full_response?: string;
      message_id?: string;
      created_at?: string;
      role?: string;
    }) => {
      if (data.done) {
        const newMessage = {
          message_id: data.message_id || uuidv4(),
          role: (data.role as "user" | "agent" | "human") || "agent",
          content: data.full_response || streamingMessage,
          created_at: data.created_at || new Date().toISOString(),
        };
        dispatch(addMessage(newMessage));
        setStreamingMessage("");
        dispatch(setIsTyping(false));
      } else {
        if (streamingMessage === "") {
          dispatch(setIsTyping(false));
        }
        setStreamingMessage((prev) => prev + data.chunk);
      }
    };

    socketInstance.on("atlas_response_chunk", handleResponseChunk);

    // If socket is already connected, emit the event
    if (socketInstance.connected && agent_id && chat_session_id) {
      socketInstance.emit("atlas-visitor-connected", {
        agent_id,
        chat_session_id,
      });
    }

    // Cleanup: disconnect socket when component unmounts
    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("atlas_response_chunk", handleResponseChunk);
      disconnectAiSocket();
      setSocket(null);
    };
  }, [agent_id, chat_session_id, isFetching]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!conversation_chain.length) return;

    const lastRole = conversation_chain[conversation_chain.length - 1]?.role;
    if (lastRole === "user") {
      scrollToBottom();
    }
  }, [conversation_chain]);

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
    (message?: string) => {
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

      if (socket) {
        socket.emit("atlas-visitor-message", {
          agent_id,
          message: msg,
          chat_session_id,
          created_at: user_message_created_at,
        });

        if (chatMode === "ai") {
          dispatch(setIsTyping(true));
        }
      }

      setNewMessageAnimating(true);
      setInputValue("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
    },
    [inputValue, socket, agent_id, chat_session_id, chatMode, dispatch]
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
