"use client";

import { memo, type RefObject } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { ConversationMessage } from "@/store/reducers/agentSlice";
import { formatChatTimestamp } from "@/utils/formatDate";
import { createMarkdownComponents } from "@/utils/markdownComponents";
import ReadReceiptMarker from "@/components/ElysiumAtlas/ReadReceiptMarker";

const conversationMarkdownComponents = createMarkdownComponents({
  codeTextColor: "#1e2939",
});

interface ConversationMessageBubbleProps {
  message: ConversationMessage;
  isTeamMember: boolean;
  needsReadReceipt: boolean;
  isVisible: boolean;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  onMarkVisible: (messageId: string, mongoId?: string | null) => void;
}

function ConversationMessageBubble({
  message,
  isTeamMember,
  needsReadReceipt,
  isVisible,
  scrollContainerRef,
  onMarkVisible,
}: ConversationMessageBubbleProps) {
  const messageBubble = (
    <>
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
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
      <span className="text-[10px] text-gray-400 dark:text-pure-mist px-1">
        {formatChatTimestamp(message.created_at)}
      </span>
    </>
  );

  const alignmentClass = `flex flex-col gap-0.5 ${
    isTeamMember ? "items-end" : "items-start"
  }`;

  if (needsReadReceipt) {
    return (
      <ReadReceiptMarker
        messageId={message.message_id}
        mongoId={message._id ?? null}
        enabled={isVisible}
        scrollRootRef={scrollContainerRef}
        onVisible={onMarkVisible}
        className={alignmentClass}
      >
        {messageBubble}
      </ReadReceiptMarker>
    );
  }

  return <div className={alignmentClass}>{messageBubble}</div>;
}

export default memo(ConversationMessageBubble);
