"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import UserAvatar from "@/components/ElysiumAtlas/UserAvatar";

interface ConversationsHistoryHeaderProps {
  isExpanded: boolean;
  totalUnread: number;
  onToggle: () => void;
}

export default function ConversationsHistoryHeader({
  isExpanded,
  totalUnread,
  onToggle,
}: ConversationsHistoryHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between px-3 h-12 shrink-0 cursor-pointer hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20 border-b border-b-serene-purple dark:border-b-pure-mist transition-colors w-full text-left"
      aria-label={
        isExpanded ? "Collapse conversations" : "Expand conversations"
      }
    >
      <div className="flex items-center gap-2">
        <UserAvatar />
        <span className="text-[13px] font-semibold text-deep-onyx dark:text-pure-mist">
          Messaging
        </span>
        {totalUnread > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-serene-purple text-white text-[10px] font-bold flex items-center justify-center">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </div>

      <span className="p-1 rounded-full hover:ring-2 hover:ring-serene-purple/60 hover:ring-offset-0 dark:hover:ring-pure-mist/60 transition-colors text-gray-500 dark:text-gray-400">
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
      </span>
    </button>
  );
}
