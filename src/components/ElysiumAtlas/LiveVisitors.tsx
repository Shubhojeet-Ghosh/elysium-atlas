"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import type { Socket } from "socket.io-client";
import aiSocket from "@/lib/aiSocket";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  setActiveVisitors,
  addActiveVisitor,
  removeActiveVisitor,
  updateActiveVisitorStatus,
  setCapturedSessions,
  upsertActiveVisitor,
} from "@/store/reducers/agentSlice";
import { VISITORS_PER_PAGE } from "@/lib/config";
import VisitorsList from "./VisitorsList";
import TeamMemberConversationsPanel from "./TeamMemberConversationsPanel";
import ConversationsHistoryPanel from "./ConversationsHistoryPanel";

export default function LiveVisitors() {
  const dispatch = useAppDispatch();
  const agentName = useAppSelector((state) => state.agent.agentName);
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

  // Reset to page 1 when agent changes
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
        limit: VISITORS_PER_PAGE,
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
      setCurrentPage(data.page);
      setTotal(data.total);
      setHasNext(data.has_next);
      setHasPrev(data.has_prev);
      setTotalPages(Math.ceil(data.total / VISITORS_PER_PAGE));
    };

    aiSocket.on("agent_visitors_list", handleVisitorsList);

    const handleVisitorDisconnected = (data: {
      agent_id: string;
      chat_session_id: string;
      sid: string;
    }) => {
      dispatch(
        updateActiveVisitorStatus({
          chat_session_id: data.chat_session_id,
          status: "offline",
        }),
      );
      setTotal((prev) => Math.max(0, prev - 1));
    };

    aiSocket.on("agent_visitor_disconnected", handleVisitorDisconnected);

    const handleNewVisitor = (data: { agent_id: string; visitor: any }) => {
      dispatch(upsertActiveVisitor(data.visitor));
      setTotal((prev) => prev + 1);
    };

    aiSocket.on("agent_new_visitor", handleNewVisitor);

    return () => {
      // notify server that this team member disconnected
      aiSocket.emit("atlas-team-member-disconnected", {
        team_id: teamID,
        user_id: userID,
        agent_id: agentID,
      });
      aiSocket.off("connect", emitConnected);
      aiSocket.off("agent_visitors_list", handleVisitorsList);
      aiSocket.off("agent_visitor_disconnected", handleVisitorDisconnected);
      aiSocket.off("agent_new_visitor", handleNewVisitor);
      // clear visitors and captured sessions from redux when leaving this view
      dispatch(setActiveVisitors([]));
      dispatch(setCapturedSessions([]));
      setSocket(null);
    };
  }, [teamID, userID, agentID, dispatch]);

  const handlePageChange = useCallback(
    (page: number) => {
      aiSocket.emit("atlas-agent-visitors-list", {
        agent_id: agentID,
        page,
        limit: VISITORS_PER_PAGE,
      });
    },
    [agentID],
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
          onPageChange={handlePageChange}
        />
      </div>

      {/* Shared bottom-right panel area:
          ConversationsHistoryPanel is always the rightmost element.
          Active chat boxes (TeamMemberConversationsPanel) grow to its left. */}
      <div className="fixed bottom-0 right-0.5 lg:right-6 z-50 flex flex-row-reverse items-end gap-3 pointer-events-none">
        <ConversationsHistoryPanel />
        <TeamMemberConversationsPanel inline />
      </div>
    </div>
  );
}
