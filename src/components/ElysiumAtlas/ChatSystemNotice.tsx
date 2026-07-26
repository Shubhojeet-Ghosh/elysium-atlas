"use client";

import { memo } from "react";
import { formatChatTimestamp } from "@/utils/formatDate";

interface ChatSystemNoticeProps {
  content: string;
  created_at: string;
}

function ChatSystemNotice({ content, created_at }: ChatSystemNoticeProps) {
  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <p className="max-w-[90%] text-center text-[12px] leading-relaxed font-medium text-gray-500">
        {content}
      </p>
      <span className="text-[10px] text-gray-400">
        {formatChatTimestamp(created_at)}
      </span>
    </div>
  );
}

export default memo(ChatSystemNotice);
