"use client";

import { useState, useRef, useEffect, memo, type MouseEvent } from "react";
import { SquarePen, Save, MoreHorizontal, Check } from "lucide-react";
import aiSocket from "@/lib/aiSocket";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  type ActiveVisitor,
  type ConversationMessage,
  type CapturedSessionMode,
} from "@/store/reducers/agentSlice";
import { isVisitorMessageUnread } from "@/utils/conversationMessageUtils";
import { useAppSelector, useAppDispatch } from "@/store";
import { setCapturedSessionAlias } from "@/store/reducers/agentSlice";

export type CapturedSession = ActiveVisitor & {
  captured_at: string;
  is_expanded: boolean;
  conversation_mode: CapturedSessionMode;
  conversation_chain: ConversationMessage[];
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronIcon({
  isExpanded,
  className = "w-4 h-4",
}: {
  isExpanded: boolean;
  className?: string;
}) {
  return (
    <svg
      className={`${className} transition-transform duration-200 ${isExpanded ? "" : "rotate-180"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
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

function ConversationChatHeader({
  session,
  isExpanded,
  onToggle,
  onClose,
  onRelease,
  onResolve,
  onLeads,
  showLeadsOption = false,
  canRelease = false,
  canMarkResolved = false,
  isReleasePending = false,
  isResolvePending = false,
  showToolCalls = false,
  onShowToolCallsChange,
}: {
  session: CapturedSession;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
  onRelease?: () => void;
  onResolve?: () => void;
  onLeads?: () => void;
  showLeadsOption?: boolean;
  canRelease?: boolean;
  canMarkResolved?: boolean;
  isReleasePending?: boolean;
  isResolvePending?: boolean;
  showToolCalls?: boolean;
  onShowToolCallsChange?: (show: boolean) => void;
}) {
  const truncateMiddle = (s?: string) => {
    if (!s) return "";
    const start = 6;
    const end = 4;
    if (s.length <= start + end) return s;
    return `${s.slice(0, start)}.....${s.slice(-end)}`;
  };

  const displayName = session.alias_name ?? session.chat_session_id;
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState<string>(
    session.alias_name ?? session.chat_session_id,
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isTouchLayout, setIsTouchLayout] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsTouchLayout(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouchLayout(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(session.alias_name ?? session.chat_session_id);
    }
  }, [session.alias_name, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);
  const commitAlias = () => {
    const newAlias = inputValue.trim() || null;
    const prevAlias = session.alias_name ?? null;
    if (newAlias === prevAlias) {
      setIsEditing(false);
      return;
    }

    dispatch(
      setCapturedSessionAlias({
        chat_session_id: session.chat_session_id,
        alias_name: newAlias,
      }),
    );

    try {
      aiSocket.emit("atlas-set-visitor-alias", {
        agent_id: session.agent_id ?? "",
        chat_session_id: session.chat_session_id,
        alias_name: newAlias ?? "",
      });
    } catch (e) {
      // ignore socket errors
    }

    setIsEditing(false);
  };

  const [flagLoadError, setFlagLoadError] = useState(false);
  const flagSrc = session.geo_data?.country_flag;
  const showFlag = !!flagSrc && !flagLoadError;

  // Derive unread state from Redux (live)- only show indicator when collapsed
  const hasUnread = useAppSelector((state) => {
    if (isExpanded) return false;
    const s = state.agent.captured_sessions.find(
      (cs) => cs.chat_session_id === session.chat_session_id,
    );
    return s?.conversation_chain.some(isVisitorMessageUnread) ?? false;
  });

  const isOnline = useAppSelector((state) => {
    const active = state.agent.active_visitors.find(
      (v) => v.chat_session_id === session.chat_session_id,
    );
    if (active) return active.visitor_online;
    const captured = state.agent.captured_sessions.find(
      (cs) => cs.chat_session_id === session.chat_session_id,
    );
    return captured?.visitor_online ?? session.visitor_online;
  });

  const presenceLabel = isOnline ? "online" : "offline";

  const releaseEnabled =
    canRelease && Boolean(onRelease) && !isReleasePending;
  const resolveEnabled =
    canMarkResolved && Boolean(onResolve) && !isResolvePending;

  useEffect(() => {
    if (!isExpanded && isEditing) {
      setIsEditing(false);
    }
  }, [isExpanded, isEditing]);

  const handleHeaderClick = () => {
    if (isEditing || isExpanded) return;
    onToggle();
  };

  const startEditing = (e?: MouseEvent) => {
    if (!isExpanded) return;
    e?.stopPropagation();
    setIsEditing(true);
  };

  const showEditControls = isExpanded;

  const headerActionGap = isTouchLayout ? "gap-2" : "gap-1";
  const headerActionBtnClass = isTouchLayout
    ? "flex items-center justify-center shrink-0 w-10 h-10 rounded-full cursor-pointer transition-colors hover:ring-2 hover:ring-serene-purple/60 hover:ring-offset-0 dark:hover:ring-pure-mist/60"
    : "flex items-center justify-center shrink-0 w-8 h-8 p-1 rounded-full cursor-pointer transition-colors hover:ring-2 hover:ring-serene-purple/60 hover:ring-offset-0 dark:hover:ring-pure-mist/60";
  const headerActionIconClass = isTouchLayout ? "w-5 h-5" : "w-4 h-4";
  const headerMinimizeIconClass = isTouchLayout ? "w-6 h-6" : "w-4 h-4";

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 min-h-16 shrink-0 select-none transition-colors border-b ${
        hasUnread
          ? "bg-serene-purple border-serene-purple/30"
          : "border-gray-100 dark:border-pure-mist"
      } ${
        !isExpanded && !isEditing
          ? `cursor-pointer ${
              hasUnread
                ? "hover:bg-serene-purple/90"
                : "hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20"
            }`
          : ""
      }`}
      onClick={handleHeaderClick}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden block relative left-1">
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

      <span className="flex-1 flex items-center min-w-0">
        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
          <div className="group flex items-center w-full min-w-0">
            {!isEditing || !showEditControls ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={`inline-block text-sm font-semibold truncate max-w-[200px] ${
                      hasUnread
                        ? "text-white"
                        : "text-gray-800 dark:text-gray-100"
                    }`}
                  >
                    {truncateMiddle(displayName)}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">{displayName}</TooltipContent>
              </Tooltip>
            ) : (
              <input
                ref={inputRef}
                onMouseDown={(e) => e.stopPropagation()}
                className="text-sm font-semibold truncate max-w-[200px] bg-transparent border-b border-gray-300 dark:border-gray-700 outline-none px-1 py-0"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitAlias();
                  } else if (e.key === "Escape") {
                    setIsEditing(false);
                  }
                }}
                onBlur={commitAlias}
              />
            )}

            {showEditControls &&
              (isEditing ? (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    commitAlias();
                  }}
                  aria-label="Save alias"
                  className={`ml-2 rounded-full cursor-pointer transition-colors ${
                    isTouchLayout ? "p-2" : "p-1"
                  } ${
                    hasUnread
                      ? "text-white hover:text-white/80"
                      : "text-serene-purple hover:text-serene-purple/80 dark:text-pure-mist"
                  }`}
                >
                  <Save className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={startEditing}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label="Edit alias"
                  className={`ml-2 rounded-full cursor-pointer transition-opacity ${
                    isTouchLayout
                      ? "p-2 opacity-100"
                      : "p-1 opacity-0 group-hover:opacity-100"
                  } ${
                    hasUnread
                      ? "text-white/80 hover:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-pure-mist"
                  }`}
                >
                  <SquarePen className="w-4 h-4" />
                </button>
              ))}
          </div>
          <span
            className={`text-[11px] font-medium leading-tight ${
              hasUnread ? "text-white/70" : "text-serene-purple"
            }`}
          >
            {presenceLabel}
          </span>
        </div>
      </span>

      <div className={`flex items-center shrink-0 ${headerActionGap}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className={`${headerActionBtnClass} ${
                hasUnread ? "text-white" : "text-gray-500"
              }`}
              aria-label="Chat options"
            >
              <MoreHorizontal className={headerActionIconClass} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[1100] w-[210px]">
            <DropdownMenuItem
              className="cursor-pointer text-[13px]"
              onSelect={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                onShowToolCallsChange?.(!showToolCalls);
              }}
            >
              Show System Activity
              {showToolCalls ? (
                <Check className="ml-auto size-4 text-serene-purple" />
              ) : null}
            </DropdownMenuItem>
            {showLeadsOption ? (
              <DropdownMenuItem
                className="cursor-pointer text-[13px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onLeads?.();
                }}
              >
                Lead details
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              className="cursor-pointer text-[13px]"
              disabled={!releaseEnabled}
              onClick={(e) => {
                e.stopPropagation();
                if (!releaseEnabled || !onRelease) return;
                onRelease();
              }}
            >
              {isReleasePending ? "Releasing…" : "Release"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-[13px]"
              disabled={!resolveEnabled}
              onClick={(e) => {
                e.stopPropagation();
                if (!resolveEnabled || !onResolve) return;
                onResolve();
              }}
            >
              {isResolvePending ? "Resolving…" : "Mark resolved"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`${headerActionBtnClass} ${
            hasUnread ? "text-white" : "text-gray-500"
          }`}
          aria-label={isExpanded ? "Minimise chat" : "Expand chat"}
        >
          <ChevronIcon
            isExpanded={isExpanded}
            className={headerMinimizeIconClass}
          />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={`${headerActionBtnClass} ${
            hasUnread ? "text-white" : "text-gray-500"
          }`}
          aria-label="Close chat"
        >
          <XIcon className={headerActionIconClass} />
        </button>
      </div>
    </div>
  );
}

export default memo(ConversationChatHeader);
