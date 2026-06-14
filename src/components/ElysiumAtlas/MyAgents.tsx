"use client";

import React, { useEffect, useRef, useState } from "react";
import fastApiAxios from "@/utils/fastapi_axios";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setMyAgents,
  setInitialAgentsFetchComplete,
  updateVisitorCounts,
} from "@/store/reducers/userAgentsSlice";
import Cookies from "js-cookie";
import aiSocket from "@/lib/aiSocket";
import type { Socket } from "socket.io-client";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Plus } from "lucide-react";
import MyAgentsTable from "./MyAgentsTable";
import MyAgentsSkeleton from "./MyAgentsSkeleton";
import { useCanManageAgents } from "@/hooks/useCanManageAgents";
import { useRouter } from "next/navigation";
import { resetAgentBuilder } from "@/store/reducers/agentBuilderSlice";
import NProgress from "nprogress";

export default function MyAgents() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const agents = useAppSelector((state) => state.userAgents.myAgents);
  const hasCompletedInitialAgentsFetch = useAppSelector(
    (state) => state.userAgents.hasCompletedInitialAgentsFetch,
  );
  const triggerFetch = useAppSelector(
    (state) => state.userAgents.trigger_fetch_agents,
  );
  const teamID = useAppSelector((state) => state.userProfile.teamID);
  const userID = useAppSelector((state) => state.userProfile.userID);
  const canManageAgents = useCanManageAgents();
  const [socket, setSocket] = useState<Socket | null>(null);

  // Placeholder handler for button
  const handleBuildNewAgent = () => {
    NProgress.start();
    dispatch(resetAgentBuilder());
    router.push("/my-agents/build");
  };

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    const allowedStatuses = ["active", "failed", "inactive"];

    async function fetchAgentsAndMaybePoll() {
      try {
        const token = Cookies.get("elysium_atlas_session_token");
        if (!token) {
          if (isMounted) dispatch(setInitialAgentsFetchComplete());
          return;
        }
        const res = await fastApiAxios.post(
          "/elysium-agents/elysium-atlas/agent/v1/list-agents",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (res.data && res.data.success) {
          const agentsList = Array.isArray(res.data.agents)
            ? res.data.agents
            : [];
          if (isMounted) dispatch(setMyAgents(agentsList));

          if (agentsList.length > 0) {
            // Check if any agent_status is not in allowedStatuses
            const hasPending = agentsList.some(
              (agent: any) => !allowedStatuses.includes(agent.agent_status),
            );
            if (hasPending && isMounted) {
              pollingRef.current = setTimeout(fetchAgentsAndMaybePoll, 5000);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching agents:", err);
      } finally {
        if (isMounted) {
          dispatch(setInitialAgentsFetchComplete());
        }
      }
    }

    fetchAgentsAndMaybePoll();

    return () => {
      isMounted = false;
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [dispatch, triggerFetch]);

  useEffect(() => {
    setSocket(aiSocket);

    const emitConnected = () => {
      aiSocket.emit("atlas-team-member-connected", {
        team_id: teamID,
        user_id: userID,
      });
    };

    if (aiSocket.connected) {
      emitConnected();
    } else {
      aiSocket.once("connect", emitConnected);
    }

    const handleVisitorCounts = (data: {
      success: boolean;
      visitor_counts: Record<string, number>;
    }) => {
      if (data.success && data.visitor_counts) {
        dispatch(updateVisitorCounts(data.visitor_counts));
      }
    };

    const handleVisitorCountUpdated = (data: {
      agent_id: string;
      visitor_count: number;
    }) => {
      if (data.agent_id !== undefined && data.visitor_count !== undefined) {
        dispatch(updateVisitorCounts({ [data.agent_id]: data.visitor_count }));
      }
    };

    aiSocket.on("agents_visitor_counts", handleVisitorCounts);
    aiSocket.on("agent_visitor_count_updated", handleVisitorCountUpdated);

    return () => {
      aiSocket.off("connect", emitConnected);
      aiSocket.off("agents_visitor_counts", handleVisitorCounts);
      aiSocket.off("agent_visitor_count_updated", handleVisitorCountUpdated);
    };
  }, [teamID, userID]);

  if (!hasCompletedInitialAgentsFetch && agents.length === 0) {
    return <MyAgentsSkeleton />;
  }

  if (agents.length === 0) {
    if (canManageAgents) {
      return null;
    }

    return (
      <p className="text-[14px] text-gray-500 dark:text-gray-400">
        No agents in this team yet.
      </p>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="flex flex-col">
        <div className="lg:text-[22px] text-[18px] font-bold flex justify-between items-center">
          <div>Agents</div>
          {canManageAgents && (
            <PrimaryButton
              onClick={handleBuildNewAgent}
              className="font-[600] flex items-center justify-center gap-2 min-w-[100px] min-h-[40px] text-[13px]"
            >
              <Plus size={16} className="-ml-1" />
              <span>New Agent</span>
            </PrimaryButton>
          )}
        </div>
        <MyAgentsTable />
      </div>
    </div>
  );
}
