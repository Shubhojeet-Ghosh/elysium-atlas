import { Clipboard, ClipboardCheck, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState, memo, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageActionsProps {
  messageId: string;
  content: string;
  agent_id: string;
}

const MessageActions = memo(
  ({ messageId, content, agent_id }: MessageActionsProps) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = useCallback(async () => {
      try {
        // Modern approach - works on most modern browsers
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(content);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        } else {
          // Fallback for older browsers or non-HTTPS
          const textArea = document.createElement("textarea");
          textArea.value = content;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand("copy");
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
          } catch (err) {
            console.error("Failed to copy text: ", err);
          } finally {
            textArea.remove();
          }
        }
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    }, [content]);

    const handleLike = useCallback(() => {
      // TODO: Implement like functionality with agent_id and messageId
      console.log("Like message:", messageId, "for agent:", agent_id);
    }, [messageId, agent_id]);

    const handleDislike = useCallback(() => {
      // TODO: Implement dislike functionality with agent_id and messageId
      console.log("Dislike message:", messageId, "for agent:", agent_id);
    }, [messageId, agent_id]);

    return (
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleCopy}
              className="group p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {isCopied ? (
                <ClipboardCheck
                  size={12}
                  className="text-gray-400 group-hover:text-gray-600"
                />
              ) : (
                <Clipboard
                  size={12}
                  className="text-gray-400 group-hover:text-gray-600"
                />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{isCopied ? "Copied!" : "Copy message"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLike}
              className="group p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ThumbsUp
                size={12}
                className="text-gray-400 group-hover:text-gray-600"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Like message</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleDislike}
              className="group p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ThumbsDown
                size={12}
                className="text-gray-400 group-hover:text-gray-600"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Dislike message</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }
);

MessageActions.displayName = "MessageActions";

export default MessageActions;
