"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Search } from "lucide-react";
import CustomInput from "@/components/inputs/CustomInput";
import type { TeamMemberConversationLog } from "@/store/reducers/agentSlice";
import { useAppSelector } from "@/store";
import ConversationsHistoryEmptyState from "./ConversationsHistoryEmptyState";
import ConversationsHistoryItem from "./ConversationsHistoryItem";

interface ConversationsHistoryBodyProps {
  fetchSessions: (
    pageNum: number,
    options?: { replace?: boolean; silent?: boolean },
  ) => Promise<void>;
  page: number;
  hasNext: boolean;
  loading: boolean;
  initialLoaded: boolean;
}

export default function ConversationsHistoryBody({
  fetchSessions,
  page,
  hasNext,
  loading,
  initialLoaded,
}: ConversationsHistoryBodyProps) {
  const conversationLogs = useAppSelector(
    (state) => state.agent.team_member_conversation_logs,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !loading) {
          fetchSessions(page + 1);
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNext, loading, page, fetchSessions]);

  const filteredLogs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversationLogs;
    return conversationLogs.filter(
      (l) =>
        l.alias_name?.toLowerCase().includes(term) ||
        l.chat_session_id.toLowerCase().includes(term),
    );
  }, [conversationLogs, searchTerm]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Search */}
      <div className="px-2 py-3 shrink-0 border-b border-gray-100 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />
          <CustomInput
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-[6px] text-[12px]"
          />
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-1 py-1"
      >
        {initialLoaded && filteredLogs.length === 0 ? (
          searchTerm.trim() ? (
            <div className="flex justify-center py-8">
              <span className="text-[12px] text-gray-400 dark:text-gray-500">
                No results for &quot;{searchTerm}&quot;
              </span>
            </div>
          ) : (
            <ConversationsHistoryEmptyState />
          )
        ) : (
          <div className="flex flex-col gap-0.5">
            {filteredLogs.map((log) => (
              <ConversationsHistoryItem key={log.chat_session_id} log={log} />
            ))}

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-4 w-full" />

            {loading && (
              <div className="flex justify-center py-2">
                <span className="text-[12px] text-gray-400 dark:text-gray-500">
                  Loading...
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
