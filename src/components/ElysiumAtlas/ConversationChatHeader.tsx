"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  type ActiveVisitor,
  type ConversationMessage,
} from "@/store/reducers/agentSlice";
import { useAppSelector } from "@/store";

export type CapturedSession = ActiveVisitor & {
  captured_at: string;
  is_expanded: boolean;
  conversation_chain: ConversationMessage[];
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "" : "rotate-180"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 6L6 18M6 6l12 12"
      />
    </svg>
  );
}

// ─── Chat header ──────────────────────────────────────────────────────────────

export default function ConversationChatHeader({
  session,
  isExpanded,
  onToggle,
  onClose,
}: {
  session: CapturedSession;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const truncateMiddle = (s?: string) => {
    if (!s) return "";
    const start = 6;
    const end = 4;
    if (s.length <= start + end) return s;
    return `${s.slice(0, start)}.....${s.slice(-end)}`;
  };

  const displayName = session.alias_name ?? session.chat_session_id;
  const [flagLoadError, setFlagLoadError] = useState(false);
  const flagSrc = session.geo_data?.country_flag;
  const showFlag = !!flagSrc && !flagLoadError;

  // Derive unread state from Redux (live) — only show indicator when collapsed
  const hasUnread = useAppSelector((state) => {
    if (isExpanded) return false;
    const s = state.agent.captured_sessions.find(
      (cs) => cs.chat_session_id === session.chat_session_id,
    );
    return s?.conversation_chain.some((m) => m.is_read === false) ?? false;
  });

  return (
    <div
      className={`flex items-center gap-4 px-3 py-3.5 shrink-0 cursor-pointer select-none transition-colors border-b ${
        hasUnread
          ? "bg-serene-purple hover:bg-serene-purple/90 border-serene-purple/30"
          : "hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20 border-gray-100 dark:border-pure-mist"
      }`}
      onClick={onToggle}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden block cursor-pointer relative left-1">
            {showFlag ? (
              <img
                src={flagSrc}
                alt={session.geo_data?.country_name ?? ""}
                onError={() => setFlagLoadError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-[11px] font-semibold text-black bg-pure-mist dark:text-pure-mist dark:bg-black">
                {session.chat_session_id.slice(-2).toUpperCase()}
              </span>
            )}
          </span>
        </TooltipTrigger>
        {session.geo_data?.country_name && (
          <TooltipContent side="top">
            {session.geo_data.country_name}
          </TooltipContent>
        )}
      </Tooltip>

      <span className="flex-1 flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={`inline-block text-sm font-semibold truncate max-w-[200px] ${
                hasUnread ? "text-white" : "text-gray-800 dark:text-gray-100"
              }`}
            >
              {truncateMiddle(displayName)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">{displayName}</TooltipContent>
        </Tooltip>
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`p-1 rounded-full cursor-pointer transition-colors hover:ring-2 hover:ring-serene-purple/60 hover:ring-offset-0 dark:hover:ring-pure-mist/60 ${
            hasUnread ? "text-white" : "text-gray-500"
          }`}
          aria-label={isExpanded ? "Minimise chat" : "Expand chat"}
        >
          <ChevronIcon isExpanded={isExpanded} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={`p-1 rounded-full cursor-pointer transition-colors hover:ring-2 hover:ring-serene-purple/60 hover:ring-offset-0 dark:hover:ring-pure-mist/60 ${
            hasUnread ? "text-white" : "text-gray-500"
          }`}
          aria-label="Close chat"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
}
