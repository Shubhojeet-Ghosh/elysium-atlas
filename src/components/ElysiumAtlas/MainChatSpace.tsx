"use client";

import { useState, useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { ArrowUp } from "lucide-react";
import { addMessage, setIsTyping } from "@/store/reducers/agentChatSlice";
import { connectAiSocket, disconnectAiSocket } from "@/lib/aiSocket";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

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
  } = useAppSelector((state) => state.agentChat);

  const dispatch = useAppDispatch();
  const [inputValue, setInputValue] = useState("");
  const [newMessageAnimating, setNewMessageAnimating] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [streamingMessage, setStreamingMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          message_id: data.message_id || crypto.randomUUID(),
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;

    if (chatMode === "ai") {
      dispatch(setIsTyping(true));
    }

    const newMessage = {
      message_id: crypto.randomUUID(),
      role: "user" as const,
      content: inputValue.trim(),
      created_at: new Date().toISOString(),
    };

    dispatch(addMessage(newMessage));

    if (socket) {
      socket.emit("atlas-visitor-message", {
        agent_id,
        message: inputValue.trim(),
      });
    }

    setNewMessageAnimating(true);
    setInputValue("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          <div className="flex-grow"></div>
          <div className="pl-[18px] pr-[16px] font-[600] py-4 space-y-6">
            {conversation_chain.map((message, index) => (
              <div
                key={message.message_id}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex-1 space-y-1 ${
                    message.role === "user" ? "text-right" : ""
                  }`}
                >
                  {message.role === "agent" || message.role === "human" ? (
                    <div className="text-[13px] text-gray-600 leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div
                      className={`inline-block rounded-2xl px-[14px] py-[12px] text-[13px] text-white text-left shadow-sm max-w-[85%] transition-all duration-200 ${
                        message.role === "user" &&
                        index === conversation_chain.length - 1 &&
                        newMessageAnimating
                          ? "opacity-0 translate-y-2"
                          : "opacity-100 translate-y-0"
                      }`}
                      style={{
                        backgroundColor: primary_color,
                        color: text_color,
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {streamingMessage && (
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <div className="text-[13px] text-gray-600 leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {streamingMessage}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 pt-[6px] pb-[10px] px-[12px]">
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
            className="p-1.5 text-white bg-black rounded-lg transition-colors shadow-sm mb-[-2px] mr-[-2px]  cursor-pointer"
            onClick={handleSendMessage}
            style={{ background: primary_color }}
          >
            <ArrowUp size={14} style={{ color: text_color }} />
          </button>
        </div>
      </div>
    </div>
  );
}
