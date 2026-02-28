"use client";
import { useCallback, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import aiSocket from "@/lib/aiSocket";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  setActiveVisitors,
  addActiveVisitor,
  removeActiveVisitor,
} from "@/store/reducers/agentSlice";
import { VISITORS_PER_PAGE } from "@/lib/config";
import VisitorsList from "./VisitorsList";

export default function LiveVisitors() {
  const dispatch = useAppDispatch();
  const agentName = useAppSelector((state) => state.agent.agentName);
  const agentID = useAppSelector((state) => state.agent.agentID);
  const teamID = useAppSelector((state) => state.userProfile.teamID);
  const userID = useAppSelector((state) => state.userProfile.userID);
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
      dispatch(removeActiveVisitor(data.chat_session_id));
      setTotal((prev) => Math.max(0, prev - 1));
    };

    aiSocket.on("agent_visitor_disconnected", handleVisitorDisconnected);

    const handleNewVisitor = (data: { agent_id: string; visitor: any }) => {
      dispatch(addActiveVisitor(data.visitor));
      setTotal((prev) => prev + 1);
    };

    aiSocket.on("agent_new_visitor", handleNewVisitor);

    return () => {
      aiSocket.off("connect", emitConnected);
      aiSocket.off("agent_visitors_list", handleVisitorsList);
      aiSocket.off("agent_visitor_disconnected", handleVisitorDisconnected);
      aiSocket.off("agent_new_visitor", handleNewVisitor);
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
    <div className="flex flex-col lg:px-[40px] px-0">
      <div className="lg:mt-[40px] mt-[20px] flex items-center justify-between">
        <p className="text-[24px] font-[700]">{agentName || "Agent"}</p>
      </div>
      <div className="mt-[30px]">
        <VisitorsList
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          total={total}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
