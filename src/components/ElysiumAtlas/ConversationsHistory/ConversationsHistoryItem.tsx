"use client";

import { useState, useRef, useEffect } from "react";
import { SquarePen, Save } from "lucide-react";
import type { TeamMemberConversationLog } from "@/store/reducers/agentSlice";
import { addOrUpdateConversationLog } from "@/store/reducers/agentSlice";
import { useAppDispatch } from "@/store";
import aiSocket from "@/lib/aiSocket";
import { formatSmartDateUTC } from "@/utils/formatDate";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConversationsHistoryItemProps {
  log: TeamMemberConversationLog;
}

function truncateMiddle(s?: string) {
  if (!s) return "";
  const start = 6;
  const end = 4;
  if (s.length <= start + end) return s;
  return `${s.slice(0, start)}.....${s.slice(-end)}`;
}

export default function ConversationsHistoryItem({
  log,
}: ConversationsHistoryItemProps) {
  const dispatch = useAppDispatch();
  const displayName = log.alias_name ?? log.chat_session_id;

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const flagUrl = log.geo_data?.country_flag;
  const countryName = log.geo_data?.country_name;

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(
    log.alias_name ?? log.chat_session_id,
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(log.alias_name ?? log.chat_session_id);
    }
  }, [log.alias_name, log.chat_session_id, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commitAlias = () => {
    const newAlias = inputValue.trim() || null;
    const prevAlias = log.alias_name ?? null;
    if (newAlias === prevAlias) {
      setIsEditing(false);
      return;
    }

    dispatch(addOrUpdateConversationLog({ ...log, alias_name: newAlias }));

    try {
      aiSocket.emit("atlas-set-visitor-alias", {
        agent_id: log.agent_id,
        chat_session_id: log.chat_session_id,
        alias_name: newAlias ?? "",
      });
    } catch {
      // ignore socket errors
    }

    setIsEditing(false);
  };

  return (
    <div className="group flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
      {/* Avatar — flag if available, else initials */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative w-9 h-9 shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden">
              {flagUrl ? (
                <img
                  src={flagUrl}
                  alt={countryName ?? "flag"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white text-[13px] font-semibold"
                  style={{ backgroundColor: log.color || "#7c3aed" }}
                >
                  {initials || "V"}
                </div>
              )}
            </div>
            {log.status === "live" && (
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-teal-green ring-2 ring-white dark:ring-deep-onyx" />
            )}
          </div>
        </TooltipTrigger>
        {countryName && (
          <TooltipContent side="top">{countryName}</TooltipContent>
        )}
      </Tooltip>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          {/* Name row with edit */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {!isEditing ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[14px] font-semibold text-deep-onyx dark:text-pure-mist truncate">
                    {truncateMiddle(displayName)}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">{displayName}</TooltipContent>
              </Tooltip>
            ) : (
              <input
                ref={inputRef}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="text-[13px] font-semibold truncate w-full bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none px-0.5"
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

            {isEditing ? (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  commitAlias();
                }}
                aria-label="Save alias"
                className="shrink-0 p-0.5 rounded-full cursor-pointer text-serene-purple hover:text-serene-purple/80 dark:text-pure-mist"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Edit alias"
                className="shrink-0 p-0.5 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-pure-mist"
              >
                <SquarePen className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {log.last_message_at && (
            <span className="text-[12px] text-gray-400 dark:text-gray-500 shrink-0">
              {formatSmartDateUTC(log.last_message_at)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate">
            {log.last_message ?? "No messages yet"}
          </p>
          {log.unread_count > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-serene-purple text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {log.unread_count > 99 ? "99+" : log.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
