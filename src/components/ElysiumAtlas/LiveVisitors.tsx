"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import aiSocket from "@/lib/aiSocket";
import { useAppDispatch, useAppSelector, store } from "../../store";
import {
  setActiveVisitors,
  triggerFetchTeamMemberChatSessions,
  updateChatSessionPresence,
  removeCapturedSession,
  clearCapturedSessions,
} from "@/store/reducers/agentSlice";
import {
  rejoinMonitorConversations,
  clearMonitorRegistry,
  abandonMonitorSession,
  setTeamMemberConnected,
  stopAllMonitorConversations,
} from "@/utils/chatMonitorUtils";
import { reackOwnedTakeoverSessions } from "@/utils/chatTakeoverUtils";
import type { ChatSessionListRow } from "@/utils/chatSessionListUtils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  VISITOR_PAGE_SIZE_OPTIONS,
  readVisitorsPageSize,
  writeVisitorsPageSize,
  type VisitorPageSize,
} from "@/lib/config";
import VisitorsList from "./VisitorsList";
import TeamMemberConversationsPanel from "./TeamMemberConversationsPanel";
import ConversationsHistoryPanel from "./ConversationsHistoryPanel";

const SEARCH_DEBOUNCE_MS = 300;
const MAX_SEARCH_QUERY_LENGTH = 200;

type VisitorsListPayload = {
  agent_id: string;
  visitors: ChatSessionListRow[];
  total: number;
  page: number;
  size: number;
  total_pages?: number;
  has_next: boolean;
  has_prev: boolean;
};

type SearchResultsPayload = VisitorsListPayload & {
  success: boolean;
  message: string | null;
  query: string;
};

type PaginationPayload = {
  total: number;
  page?: number;
  has_next?: boolean;
  has_prev?: boolean;
  size?: number;
  total_pages?: number;
};

export default function LiveVisitors() {
  const dispatch = useAppDispatch();
  const agentID = useAppSelector((state) => state.agent.agentID);
  const teamID = useAppSelector((state) => state.userProfile.teamID);
  const userID = useAppSelector((state) => state.userProfile.userID);
  const capturedSessions = useAppSelector(
    (state) => state.agent.captured_sessions,
  );

  const [socket, setSocket] = useState<Socket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(() =>
    readVisitorsPageSize(),
  );

  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;
  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;
  const searchQueryRef = useRef(debouncedSearchQuery);
  searchQueryRef.current = debouncedSearchQuery.trim();
  const pendingListPageRef = useRef<number | null>(null);
  const pendingSearchRef = useRef<{ query: string; page: number } | null>(null);
  const capturedSessionsRef = useRef(capturedSessions);
  capturedSessionsRef.current = capturedSessions;

  const applyPagination = useCallback((payload: PaginationPayload) => {
    const limit = payload.size ?? pageSizeRef.current;
    setCurrentPage(payload.page ?? currentPageRef.current);
    setTotal(payload.total);
    setHasNext(payload.has_next ?? false);
    setHasPrev(payload.has_prev ?? false);
    setTotalPages(
      payload.total_pages != null
        ? payload.total_pages
        : payload.total > 0
          ? Math.max(1, Math.ceil(payload.total / limit))
          : 0,
    );
  }, []);

  const fetchSessions = useCallback(
    (page: number, limit = pageSizeRef.current) => {
      if (!agentID) return;

      const query = searchQueryRef.current;
      setIsLoadingSessions(true);

      if (query) {
        pendingSearchRef.current = { query, page };
        pendingListPageRef.current = null;
        aiSocket.emit("atlas-agent-visitors-search", {
          agent_id: agentID,
          query,
          page,
          limit,
        });
        return;
      }

      pendingListPageRef.current = page;
      pendingSearchRef.current = null;
      aiSocket.emit("atlas-agent-visitors-list", {
        agent_id: agentID,
        page,
        limit,
      });
    },
    [agentID],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      const trimmed = value.slice(0, MAX_SEARCH_QUERY_LENGTH);
      setSearchTerm(trimmed);
      dispatch(setActiveVisitors([]));
      if (!trimmed.trim()) {
        setCurrentPage(1);
      }
    },
    [dispatch],
  );

  const handlePageSizeChange = useCallback(
    (size: VisitorPageSize) => {
      setPageSize(size);
      writeVisitorsPageSize(size);
      setCurrentPage(1);
      fetchSessions(1, size);
    },
    [fetchSessions],
  );

  const handleRefresh = useCallback(() => {
    fetchSessions(currentPageRef.current, pageSizeRef.current);
    dispatch(triggerFetchTeamMemberChatSessions());
  }, [dispatch, fetchSessions]);

  useEffect(() => {
    setSearchTerm("");
    setCurrentPage(1);
    setIsLoadingSessions(true);
    dispatch(setActiveVisitors([]));
  }, [agentID, dispatch]);

  const prevDebouncedSearchRef = useRef(debouncedSearchQuery);
  useEffect(() => {
    if (prevDebouncedSearchRef.current === debouncedSearchQuery) return;
    prevDebouncedSearchRef.current = debouncedSearchQuery;

    setCurrentPage(1);
    fetchSessions(1);
  }, [debouncedSearchQuery, fetchSessions]);

  useEffect(() => {
    if (!agentID || !teamID || !userID) {
      setIsLoadingSessions(false);
      return;
    }

    setIsLoadingSessions(true);
    setSocket(aiSocket);

    const stopMonitoringAndReset = () => {
      stopAllMonitorConversations();
      setTeamMemberConnected(false);
      dispatch(clearCapturedSessions());
      clearMonitorRegistry();
    };

    const emitConnected = () => {
      aiSocket.emit("atlas-team-member-connected", {
        team_id: teamID,
        user_id: userID,
        agent_id: agentID,
        page: 1,
        limit: pageSizeRef.current,
      });

      setTeamMemberConnected(true);

      const monitorSessionIds = capturedSessionsRef.current
        .filter((session) => session.conversation_mode === "monitor")
        .map((session) => session.chat_session_id);
      if (monitorSessionIds.length > 0) {
        rejoinMonitorConversations(agentID, monitorSessionIds);
      }

      const takeoverSessionIds = new Set<string>();
      for (const session of capturedSessionsRef.current) {
        if (session.conversation_mode === "takeover") {
          takeoverSessionIds.add(session.chat_session_id);
        }
      }
      for (const visitor of store.getState().agent.active_visitors) {
        if (visitor.in_conversation_with === userID) {
          takeoverSessionIds.add(visitor.chat_session_id);
        }
      }
      reackOwnedTakeoverSessions(agentID, takeoverSessionIds);

      if (searchQueryRef.current) {
        fetchSessions(1, pageSizeRef.current);
      } else {
        pendingListPageRef.current = 1;
        setIsLoadingSessions(true);
      }
    };

    if (aiSocket.connected) {
      emitConnected();
    } else {
      aiSocket.once("connect", emitConnected);
    }

    const handleVisitorsList = (data: VisitorsListPayload) => {
      if (data.agent_id !== agentID) return;
      if (searchQueryRef.current) return;
      if (pendingListPageRef.current !== data.page) return;

      pendingListPageRef.current = null;
      setIsLoadingSessions(false);
      const visitors = data.visitors ?? [];
      dispatch(setActiveVisitors(visitors));
      applyPagination({
        total: data.total,
        page: data.page,
        has_next: data.has_next,
        has_prev: data.has_prev,
        size: data.size,
        total_pages: data.total_pages,
      });

      reackOwnedTakeoverSessions(
        agentID,
        visitors
          .filter((v) => v.in_conversation_with === userID)
          .map((v) => v.chat_session_id),
      );
    };

    const handleSearchResults = (data: SearchResultsPayload) => {
      if (data.agent_id !== agentID) return;

      const pending = pendingSearchRef.current;
      if (!pending) return;
      if (data.query !== pending.query || data.page !== pending.page) return;

      pendingSearchRef.current = null;
      setIsLoadingSessions(false);

      if (!data.success) {
        dispatch(setActiveVisitors([]));
        applyPagination({
          total: 0,
          page: 1,
          has_next: false,
          has_prev: false,
        });
        if (data.message) toast.error(data.message);
        return;
      }

      dispatch(setActiveVisitors(data.visitors ?? []));
      applyPagination({
        total: data.total,
        page: data.page,
        has_next: data.has_next,
        has_prev: data.has_prev,
        size: data.size,
        total_pages: data.total_pages,
      });
    };

    const handleVisitorDisconnected = (data: {
      agent_id: string;
      chat_session_id: string;
      sid: string;
      pagination?: PaginationPayload;
    }) => {
      if (data.agent_id !== agentID) return;

      dispatch(
        updateChatSessionPresence({
          chat_session_id: data.chat_session_id,
          visitor_online: false,
          sid: null,
        }),
      );

      if (data.pagination && !searchQueryRef.current) {
        applyPagination({
          total: data.pagination.total,
          page: data.pagination.page ?? currentPageRef.current,
          has_next: data.pagination.has_next ?? false,
          has_prev: data.pagination.has_prev ?? false,
          total_pages: data.pagination.total_pages,
        });
      }
    };

    const handlePaginationUpdated = (data: {
      agent_id: string;
      total: number;
    }) => {
      if (data.agent_id !== agentID) return;
      if (searchQueryRef.current) return;

      const page = currentPageRef.current;
      const limit = pageSizeRef.current;

      applyPagination({
        total: data.total,
        page,
        has_next: page * limit < data.total,
        has_prev: page > 1,
        size: limit,
      });
    };

    aiSocket.on("agent_visitors_list", handleVisitorsList);
    aiSocket.on("agent_visitors_search_results", handleSearchResults);
    aiSocket.on("agent_visitor_disconnected", handleVisitorDisconnected);
    aiSocket.on("agent_visitors_pagination_updated", handlePaginationUpdated);

    const handleMonitorStarted = (data: {
      success: boolean;
      agent_id: string;
      chat_session_id: string;
      message?: string | null;
      takeover_active?: boolean;
      in_conversation_with?: string | null;
      in_conversation_with_name?: string | null;
    }) => {
      if (data.agent_id !== agentID) return;

      if (!data.success) {
        abandonMonitorSession(data.chat_session_id);
        dispatch(removeCapturedSession(data.chat_session_id));
        toast.error(
          data.message ?? "Unable to monitor this conversation.",
        );
        return;
      }

      if (data.takeover_active && data.in_conversation_with) {
        const visitor = store
          .getState()
          .agent.active_visitors.find(
            (v) => v.chat_session_id === data.chat_session_id,
          );
        if (visitor) {
          dispatch(
            updateChatSessionPresence({
              chat_session_id: data.chat_session_id,
              visitor_online: visitor.visitor_online,
              sid: visitor.sid,
              in_conversation_with: data.in_conversation_with,
              in_conversation_with_name:
                data.in_conversation_with_name ?? visitor.in_conversation_with_name,
            }),
          );
        }
      }
    };

    const syncTakeoverPresence = (
      chat_session_id: string,
      in_conversation_with: string | null,
      in_conversation_with_name?: string | null,
    ) => {
      const visitor = store
        .getState()
        .agent.active_visitors.find((v) => v.chat_session_id === chat_session_id);
      if (!visitor) return;

      dispatch(
        updateChatSessionPresence({
          chat_session_id,
          visitor_online: visitor.visitor_online,
          sid: visitor.sid,
          in_conversation_with,
          ...(in_conversation_with_name !== undefined
            ? { in_conversation_with_name }
            : {}),
        }),
      );
    };

    const handleSessionTakeoverStarted = (data: {
      agent_id?: string;
      chat_session_id: string;
      in_conversation_with?: string;
      in_conversation_with_name?: string | null;
    }) => {
      if (data.agent_id && data.agent_id !== agentID) return;
      syncTakeoverPresence(
        data.chat_session_id,
        data.in_conversation_with ?? null,
        data.in_conversation_with_name,
      );
    };

    const handleSessionTakeoverEnded = (data: {
      agent_id?: string;
      chat_session_id: string;
    }) => {
      if (data.agent_id && data.agent_id !== agentID) return;
      syncTakeoverPresence(data.chat_session_id, null);
    };

    aiSocket.on("monitor_conversation_started", handleMonitorStarted);

    const handleMonitorEnded = (data: {
      success: boolean;
      agent_id: string;
      chat_session_id: string;
      reason?: string;
      message?: string | null;
    }) => {
      if (data.agent_id !== agentID) return;

      if (data.reason === "takeover_restricted") {
        abandonMonitorSession(data.chat_session_id);
        dispatch(removeCapturedSession(data.chat_session_id));
        toast.info(
          data.message ??
            "This conversation is now handled by a team member.",
        );
      }
    };

    aiSocket.on("monitor_conversation_ended", handleMonitorEnded);
    aiSocket.on("session_takeover_started", handleSessionTakeoverStarted);
    aiSocket.on("session_takeover_ended", handleSessionTakeoverEnded);

    const handleBeforeUnload = () => {
      stopAllMonitorConversations();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopMonitoringAndReset();
      aiSocket.emit("atlas-team-member-disconnected", {
        team_id: teamID,
        user_id: userID,
        agent_id: agentID,
      });
      aiSocket.off("connect", emitConnected);
      aiSocket.off("agent_visitors_list", handleVisitorsList);
      aiSocket.off("agent_visitors_search_results", handleSearchResults);
      aiSocket.off("agent_visitor_disconnected", handleVisitorDisconnected);
      aiSocket.off("agent_visitors_pagination_updated", handlePaginationUpdated);
      aiSocket.off("monitor_conversation_started", handleMonitorStarted);
      aiSocket.off("monitor_conversation_ended", handleMonitorEnded);
      aiSocket.off("session_takeover_started", handleSessionTakeoverStarted);
      aiSocket.off("session_takeover_ended", handleSessionTakeoverEnded);
      dispatch(setActiveVisitors([]));
      setSocket(null);
    };
  }, [
    teamID,
    userID,
    agentID,
    dispatch,
    applyPagination,
    fetchSessions,
  ]);

  const handlePageChange = useCallback(
    (page: number) => {
      fetchSessions(page);
    },
    [fetchSessions],
  );

  return (
    <div className="flex flex-col">
      <div className="mt-2.5">
        <VisitorsList
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          total={total}
          pageSize={pageSize}
          pageSizeOptions={VISITOR_PAGE_SIZE_OPTIONS}
          searchQuery={searchTerm}
          debouncedSearchQuery={debouncedSearchQuery}
          isSearchActive={Boolean(debouncedSearchQuery.trim())}
          isLoadingSessions={isLoadingSessions}
          onSearchChange={handleSearchChange}
          onRefresh={handleRefresh}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <div className="fixed bottom-0 right-0.5 lg:right-6 z-50 flex flex-row-reverse items-end gap-3 pointer-events-none">
        <ConversationsHistoryPanel />
        <TeamMemberConversationsPanel inline />
      </div>
    </div>
  );
}
