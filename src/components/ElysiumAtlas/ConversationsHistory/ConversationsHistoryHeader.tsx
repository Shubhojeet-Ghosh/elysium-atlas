"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import UserAvatar from "@/components/ElysiumAtlas/UserAvatar";

interface ConversationsHistoryHeaderProps {
  isExpanded: boolean;
  totalUnread: number;
  hasCollapsedUnread: boolean;
  onToggle: () => void;
}

export default function ConversationsHistoryHeader({
  isExpanded,
  totalUnread,
  hasCollapsedUnread,
  onToggle,
}: ConversationsHistoryHeaderProps) {
  const [isTouchLayout, setIsTouchLayout] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsTouchLayout(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouchLayout(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleWrapperClass =
    "flex items-center justify-center shrink-0 w-8 h-8";
  const toggleIconClass = isTouchLayout ? "w-5 h-5" : "w-4 h-4";

  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between px-4 py-3.5 min-h-14 shrink-0 cursor-pointer hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20 border-b border-b-serene-purple dark:border-b-pure-mist transition-colors w-full text-left"
      aria-label={
        isExpanded ? "Collapse conversations" : "Expand conversations"
      }
    >
      <div className="flex items-center gap-2 min-w-0">
        <UserAvatar />
        <span className="text-[13px] font-semibold text-deep-onyx dark:text-pure-mist">
          Messaging
        </span>
        {!isExpanded && hasCollapsedUnread && (
          <span className="w-2 h-2 rounded-full bg-serene-purple shrink-0" />
        )}
      </div>

      <span
        className={`${toggleWrapperClass} rounded-full hover:ring-2 hover:ring-serene-purple/60 hover:ring-offset-0 dark:hover:ring-pure-mist/60 transition-colors text-gray-500 dark:text-gray-400`}
      >
        {isExpanded ? (
          <ChevronDown className={toggleIconClass} />
        ) : (
          <ChevronUp className={toggleIconClass} />
        )}
      </span>
    </button>
  );
}
