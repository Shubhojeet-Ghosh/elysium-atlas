import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import MessageActions from "./MessageActions";
import { formatChatTimestamp } from "@/utils/formatDate";
import { markdownComponents } from "@/utils/markdownComponents";

interface ChatMessageProps {
  message: {
    message_id: string;
    role: "user" | "agent" | "human";
    content: string;
    created_at: string;
  };
  agent_id: string;
  primary_color: string;
  text_color: string;
  isLast: boolean;
  isAnimating: boolean;
}

const ChatMessage = memo(
  ({
    message,
    agent_id,
    primary_color,
    text_color,
    isLast,
    isAnimating,
  }: ChatMessageProps) => {
    return (
      <div
        className={`flex gap-3 ${
          message.role === "user" ? "flex-row-reverse" : ""
        }`}
      >
        <div
          className={`flex-1 space-y-1 min-w-0 ${
            message.role === "user" ? "text-right" : ""
          }`}
        >
          {message.role === "agent" || message.role === "human" ? (
            <>
              <div
                className="text-[13px] text-gray-600 leading-relaxed prose prose-sm"
                style={{ maxWidth: "650px", wordWrap: "break-word" }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              <div className="flex items-center justify-between w-full mt-1">
                <div className="text-[10px] text-gray-400">
                  {formatChatTimestamp(message.created_at)}
                </div>
                <MessageActions
                  messageId={message.message_id}
                  content={message.content}
                  agent_id={agent_id}
                />
              </div>
            </>
          ) : (
            <>
              <div
                className={`inline-block rounded-2xl px-[14px] py-[12px] text-[13px] text-white text-left shadow-sm max-w-[85%] transition-all duration-200 ${
                  message.role === "user" && isLast && isAnimating
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
              <div className="text-[10px] text-gray-400 mt-1 text-right">
                {formatChatTimestamp(message.created_at)}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
