"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Cookies from "js-cookie";
import { Search } from "lucide-react";
import CustomInput from "@/components/inputs/CustomInput";
import type { TeamMemberConversationLog } from "@/store/reducers/agentSlice";
import {
  setTeamMemberConversationLogs,
  addOrUpdateConversationLog,
} from "@/store/reducers/agentSlice";
import { useAppSelector, useAppDispatch } from "@/store";
import fastApiAxios from "@/utils/fastapi_axios";
import ConversationsHistoryEmptyState from "./ConversationsHistoryEmptyState";
import ConversationsHistoryItem from "./ConversationsHistoryItem";

interface ApiResponseItem {
  chat_session_id: string;
  alias_name: string | null;
  last_message_at: string | null;
  visitor_online: boolean;
  last_connected_at: string;
  geo_data: {
    country_name: string | null;
    country_flag: string | null;
    district: string | null;
    ip: string | null;
    time_zone: string | null;
  } | null;
  last_message: {
    message_id: string;
    role: string;
    content: string;
    created_at: string;
  } | null;
}

function mapToLog(
  item: ApiResponseItem,
  agentId: string,
): TeamMemberConversationLog {
  return {
    chat_session_id: item.chat_session_id,
    alias_name: item.alias_name,
    agent_id: agentId,
    last_message: item.last_message?.content ?? null,
    last_message_at: item.last_message_at,
    captured_at: item.last_connected_at,
    ended_at: null,
    status: item.visitor_online ? "live" : "ended",
    unread_count: 0,
    color: "",
    geo_data: item.geo_data ?? null,
  };
}

export default function ConversationsHistoryBody() {
  const dispatch = useAppDispatch();
  const agentID = useAppSelector((state) => state.agent.agentID);
  const conversationLogs = useAppSelector(
    (state) => state.agent.team_member_conversation_logs,
  );

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (!agentID) return;
      const token = Cookies.get("elysium_atlas_session_token");
      setLoading(true);
      try {
        const res = await fastApiAxios.post(
          "/elysium-agents/atlas-team-members/team-member-chat-sessions",
          { agent_id: agentID, page: pageNum, limit: 20 },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const { data, has_next } = res.data as {
          data: ApiResponseItem[];
          has_next: boolean;
        };

        const logs = data.map((item) => mapToLog(item, agentID));

        if (pageNum === 1) {
          dispatch(setTeamMemberConversationLogs(logs));
        } else {
          logs.forEach((log) => dispatch(addOrUpdateConversationLog(log)));
        }

        setHasNext(has_next);
        setPage(pageNum);
      } catch {
        // silently ignore fetch errors
      } finally {
        setLoading(false);
        if (pageNum === 1) setInitialLoaded(true);
      }
    },
    [agentID, dispatch],
  );

  // Initial load
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !loading) {
          fetchPage(page + 1);
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNext, loading, page, fetchPage]);

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
