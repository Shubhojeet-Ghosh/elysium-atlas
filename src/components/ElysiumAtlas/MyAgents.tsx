"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import fastApiAxios from "@/utils/fastapi_axios";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setAgentsList,
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
import { isSettledAgentStatus } from "@/utils/agentStatus";
import {
  DEFAULT_DATASOURCE_PAGE_SIZE,
  VISITOR_PAGE_SIZE_OPTIONS,
  type VisitorPageSize,
} from "@/lib/config";

export default function MyAgents() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const agentsTotal = useAppSelector((state) => state.userAgents.agentsTotal);
  const hasCompletedInitialAgentsFetch = useAppSelector(
    (state) => state.userAgents.hasCompletedInitialAgentsFetch,
  );
  const triggerFetch = useAppSelector(
    (state) => state.userAgents.trigger_fetch_agents,
  );
  const teamID = useAppSelector((state) => state.userProfile.teamID);
  const userID = useAppSelector((state) => state.userProfile.userID);
  const canManageAgents = useCanManageAgents();
  const [, setSocket] = useState<Socket | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(
    DEFAULT_DATASOURCE_PAGE_SIZE,
  );
  const [isLoading, setIsLoading] = useState(true);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const clearPolling = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleBuildNewAgent = () => {
    NProgress.start();
    dispatch(resetAgentBuilder());
    router.push("/my-agents/build");
  };

  const loadAgents = useCallback(
    async (page: number, limit: VisitorPageSize, forPolling = false) => {
      if (!forPolling) {
        setIsLoading(true);
      }

      try {
        const token = Cookies.get("elysium_atlas_session_token");
        if (!token) {
          dispatch(setAgentsList({ agents: [], total: 0 }));
          setTotal(0);
          setTotalPages(1);
          setHasNext(false);
          setHasPrev(false);
          return;
        }

        const res = await fastApiAxios.post(
          "/elysium-agents/elysium-atlas/agent/v1/list-agents",
          { page, limit },
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
          const responseTotal = res.data.total ?? agentsList.length;
          const responseLimit = res.data.limit ?? limit;
          const responsePage = res.data.page ?? page;

          dispatch(setAgentsList({ agents: agentsList, total: responseTotal }));
          setCurrentPage(responsePage);
          setTotal(responseTotal);
          setHasNext(
            res.data.has_next ??
              responsePage * responseLimit < responseTotal,
          );
          setHasPrev(res.data.has_prev ?? responsePage > 1);
          setTotalPages(
            res.data.total_pages ??
              (responseTotal > 0
                ? Math.max(1, Math.ceil(responseTotal / responseLimit))
                : 1),
          );

          clearPolling();
          if (
            agentsList.length > 0 &&
            agentsList.some(
              (agent: { agent_status?: string }) =>
                !isSettledAgentStatus(agent.agent_status ?? ""),
            )
          ) {
            pollingRef.current = setTimeout(
              () => loadAgents(responsePage, limit, true),
              5000,
            );
          }
        }
      } catch (err) {
        console.error("Error fetching agents:", err);
      } finally {
        dispatch(setInitialAgentsFetchComplete());
        if (!forPolling) {
          setIsLoading(false);
        }
      }
    },
    [dispatch],
  );

  useEffect(() => {
    loadAgents(currentPage, pageSize);

    return () => {
      clearPolling();
    };
  }, [currentPage, pageSize, triggerFetch, loadAgents]);

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
  }, [teamID, userID, dispatch]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: VisitorPageSize) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  if (!hasCompletedInitialAgentsFetch && agentsTotal === 0 && isLoading) {
    return <MyAgentsSkeleton />;
  }

  if (agentsTotal === 0) {
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
        <MyAgentsTable
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          total={total}
          pageSize={pageSize}
          pageSizeOptions={VISITOR_PAGE_SIZE_OPTIONS}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}
