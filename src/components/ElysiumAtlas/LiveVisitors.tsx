"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import type { Socket } from "socket.io-client";
import aiSocket from "@/lib/aiSocket";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  setActiveVisitors,
  updateActiveVisitorStatus,
  reconnectActiveVisitorIfPresent,
  setCapturedSessions,
} from "@/store/reducers/agentSlice";
import {
  VISITOR_PAGE_SIZE_OPTIONS,
  readVisitorsPageSize,
  writeVisitorsPageSize,
  type VisitorPageSize,
} from "@/lib/config";
import VisitorsList from "./VisitorsList";
import TeamMemberConversationsPanel from "./TeamMemberConversationsPanel";
import ConversationsHistoryPanel from "./ConversationsHistoryPanel";

export default function LiveVisitors() {
  const dispatch = useAppDispatch();
  const agentID = useAppSelector((state) => state.agent.agentID);
  const teamID = useAppSelector((state) => state.userProfile.teamID);
  const userID = useAppSelector((state) => state.userProfile.userID);
  const capturedSessions = useAppSelector(
    (state) => state.agent.captured_sessions,
  );
  const [socket, setSocket] = useState<Socket | null>(null);
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

  const applyPagination = useCallback(
    (payload: {
      total: number;
      page: number;
      has_next: boolean;
      has_prev: boolean;
      size?: number;
    }) => {
      const limit = payload.size ?? pageSizeRef.current;
      setCurrentPage(payload.page);
      setTotal(payload.total);
      setHasNext(payload.has_next);
      setHasPrev(payload.has_prev);
      setTotalPages(
        payload.total > 0 ? Math.max(1, Math.ceil(payload.total / limit)) : 0,
      );
    },
    [],
  );

  const refetchVisitorsPage = useCallback(
    (page: number, limit = pageSizeRef.current) => {
      if (!agentID) return;
      aiSocket.emit("atlas-agent-visitors-list", {
        agent_id: agentID,
        page,
        limit,
      });
    },
    [agentID],
  );

  const handlePageSizeChange = useCallback(
    (size: VisitorPageSize) => {
      setPageSize(size);
      writeVisitorsPageSize(size);
      refetchVisitorsPage(1, size);
    },
    [refetchVisitorsPage],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [agentID]);

  // Re-establish conversations for any previously captured sessions on mount
  const _startedCapturedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!capturedSessions || capturedSessions.length === 0) return;

    const emitForCaptured = () => {
      capturedSessions.forEach((s) => {
        const cid = s.chat_session_id;
        if (!cid || _startedCapturedRef.current.has(cid)) return;
        aiSocket.emit("atlas-team-member-start-conversation", {
          agent_id: agentID,
          chat_session_id: cid,
        });
        _startedCapturedRef.current.add(cid);
      });
    };

    if (aiSocket.connected) {
      emitForCaptured();
    } else {
      const onConnect = () => emitForCaptured();
      aiSocket.once("connect", onConnect);
      return () => {
        aiSocket.off("connect", onConnect);
      };
    }
  }, [capturedSessions, agentID]);

  useEffect(() => {
    setSocket(aiSocket);

    const emitConnected = () => {
      console.log("[LiveVisitors] Socket connected:", aiSocket.id);
      aiSocket.emit("atlas-team-member-connected", {
        team_id: teamID,
        user_id: userID,
        agent_id: agentID,
        page: 1,
        limit: pageSizeRef.current,
      });
    };

    if (aiSocket.connected) {
      emitConnected();
    } else {
      aiSocket.once("connect", emitConnected);
    }

    const handleVisitorsList = (data: {
      agent_id: string;
      visitors: any[];
      total: number;
      page: number;
      size: number;
      has_next: boolean;
      has_prev: boolean;
    }) => {
      dispatch(setActiveVisitors(data.visitors ?? []));
      applyPagination({
        total: data.total,
        page: data.page,
        has_next: data.has_next,
        has_prev: data.has_prev,
        size: data.size,
      });
    };

    aiSocket.on("agent_visitors_list", handleVisitorsList);

    const handleVisitorDisconnected = (data: {
      agent_id: string;
      chat_session_id: string;
      sid: string;
      pagination?: {
        total: number;
        page?: number;
        has_next?: boolean;
        has_prev?: boolean;
      };
    }) => {
      dispatch(
        updateActiveVisitorStatus({
          chat_session_id: data.chat_session_id,
          status: "offline",
        }),
      );

      if (data.pagination) {
        applyPagination({
          total: data.pagination.total,
          page: data.pagination.page ?? currentPageRef.current,
          has_next: data.pagination.has_next ?? false,
          has_prev: data.pagination.has_prev ?? false,
        });
      }
    };

    aiSocket.on("agent_visitor_disconnected", handleVisitorDisconnected);

    const handlePaginationUpdated = (data: {
      agent_id: string;
      total: number;
      page?: number;
      has_next?: boolean;
      has_prev?: boolean;
    }) => {
      const newPage = data.page ?? currentPageRef.current;
      const pageChanged = newPage !== currentPageRef.current;

      applyPagination({
        total: data.total,
        page: newPage,
        has_next: data.has_next ?? false,
        has_prev: data.has_prev ?? false,
      });

      // Only refetch when the backend moves us to a different page (e.g. last
      // visitor on the current page left). Avoid refetch on the same page so
      // disconnected visitors stay visible as offline in the table.
      if (pageChanged) {
        refetchVisitorsPage(newPage);
      }
    };

    aiSocket.on("agent_visitors_pagination_updated", handlePaginationUpdated);

    const handleNewVisitor = (data: { agent_id: string; visitor: any }) => {
      const chatSessionId = data.visitor?.chat_session_id;
      if (!chatSessionId) return;

      dispatch(reconnectActiveVisitorIfPresent(data.visitor));
    };

    aiSocket.on("agent_new_visitor", handleNewVisitor);

    return () => {
      aiSocket.emit("atlas-team-member-disconnected", {
        team_id: teamID,
        user_id: userID,
        agent_id: agentID,
      });
      aiSocket.off("connect", emitConnected);
      aiSocket.off("agent_visitors_list", handleVisitorsList);
      aiSocket.off("agent_visitor_disconnected", handleVisitorDisconnected);
      aiSocket.off("agent_new_visitor", handleNewVisitor);
      aiSocket.off("agent_visitors_pagination_updated", handlePaginationUpdated);
      dispatch(setActiveVisitors([]));
      dispatch(setCapturedSessions([]));
      setSocket(null);
    };
  }, [teamID, userID, agentID, dispatch, applyPagination, refetchVisitorsPage]);

  const handlePageChange = useCallback(
    (page: number) => {
      refetchVisitorsPage(page);
    },
    [refetchVisitorsPage],
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
