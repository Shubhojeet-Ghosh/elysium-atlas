"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import CustomInput from "@/components/inputs/CustomInput";
import { useAppDispatch, useAppSelector } from "@/store";
import { setTeamMemberConversationLogs } from "@/store/reducers/agentSlice";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isKbSearchInProgress } from "@/utils/kbSearchUi";
import Spinner from "@/components/ui/Spinner";
import ConversationsHistoryEmptyState from "./ConversationsHistoryEmptyState";
import ConversationsHistoryItem from "./ConversationsHistoryItem";

const SEARCH_DEBOUNCE_MS = 300;
const MAX_SEARCH_QUERY_LENGTH = 200;

interface ConversationsHistoryBodyProps {
  fetchSessions: (
    pageNum: number,
    options?: { replace?: boolean; silent?: boolean; query?: string },
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
  const dispatch = useAppDispatch();
  const agentID = useAppSelector((state) => state.agent.agentID);
  const conversationLogs = useAppSelector(
    (state) => state.agent.team_member_conversation_logs,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchQueryRef = useRef(debouncedSearchQuery);
  searchQueryRef.current = debouncedSearchQuery.trim();

  const isSearching = isKbSearchInProgress(
    searchTerm,
    debouncedSearchQuery,
    loading,
  );
  const isSearchActive = Boolean(debouncedSearchQuery.trim());
  const displayLogs = isSearching ? [] : conversationLogs;

  useEffect(() => {
    setSearchTerm("");
  }, [agentID]);

  const prevDebouncedSearchRef = useRef(debouncedSearchQuery);
  useEffect(() => {
    if (prevDebouncedSearchRef.current === debouncedSearchQuery) return;
    prevDebouncedSearchRef.current = debouncedSearchQuery;

    const query = debouncedSearchQuery.trim();
    fetchSessions(1, { replace: true, query: query || undefined });
  }, [debouncedSearchQuery, fetchSessions]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || !hasNext || loading) return;

        const query = searchQueryRef.current;
        fetchSessions(page + 1, { query: query || undefined });
      },
      { root: scrollContainerRef.current, threshold: 0.1 },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNext, loading, page, fetchSessions]);

  const handleSearchChange = (value: string) => {
    const trimmed = value.slice(0, MAX_SEARCH_QUERY_LENGTH);
    setSearchTerm(trimmed);
    dispatch(setTeamMemberConversationLogs([]));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-2 py-3 shrink-0 border-b border-gray-100 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />
          <CustomInput
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search conversations..."
            maxLength={MAX_SEARCH_QUERY_LENGTH}
            className="w-full pl-9 pr-3 py-[6px] text-[12px]"
          />
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-1 py-1"
      >
        {isSearching ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <Spinner className="border-serene-purple dark:border-pure-mist" />
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              Searching &apos;{searchTerm.trim()}&apos;
            </p>
          </div>
        ) : initialLoaded && displayLogs.length === 0 ? (
          isSearchActive ? (
            <div className="flex justify-center py-8 px-4 text-center">
              <span className="text-[12px] text-gray-400 dark:text-gray-500">
                No conversations found matching &quot;
                {debouncedSearchQuery.trim()}&quot;
              </span>
            </div>
          ) : (
            <ConversationsHistoryEmptyState />
          )
        ) : (
          <div className="flex flex-col gap-0.5">
            {displayLogs.map((log) => (
              <ConversationsHistoryItem
                key={log.chat_session_id}
                log={log}
                highlightQuery={
                  isSearchActive ? debouncedSearchQuery.trim() : undefined
                }
              />
            ))}

            <div ref={sentinelRef} className="h-4 w-full" />

            {loading && displayLogs.length > 0 && (
              <div className="flex justify-center py-2">
                <Spinner className="h-4 w-4 border-serene-purple dark:border-pure-mist" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
