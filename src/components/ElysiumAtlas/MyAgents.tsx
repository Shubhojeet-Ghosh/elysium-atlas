"use client";

import React, { useEffect, useRef, useState } from "react";
import fastApiAxios from "@/utils/fastapi_axios";
import { useAppDispatch, useAppSelector } from "@/store";
import { setMyAgents } from "@/store/reducers/userAgentsSlice";
import Cookies from "js-cookie";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Plus } from "lucide-react";
import MyAgentsTable from "./MyAgentsTable";
import { useRouter } from "next/navigation";
import { setCurrentStep } from "@/store/reducers/agentBuilderSlice";

export default function MyAgents() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const agents = useAppSelector((state) => state.userAgents.myAgents);
  const triggerFetch = useAppSelector(
    (state) => state.userAgents.trigger_fetch_agents
  );
  // Placeholder state for loading and agentName

  // Placeholder handler for button
  const handleBuildNewAgent = () => {
    dispatch(setCurrentStep(1));
    router.push("/my-agents/build");
  };

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    const allowedStatuses = ["active", "failed", "inactive"];

    async function fetchAgentsAndMaybePoll() {
      try {
        const token = Cookies.get("elysium_atlas_session_token");
        const res = await fastApiAxios.post(
          "/elysium-agents/elysium-atlas/agent/v1/list-agents",
          {},
          token
            ? {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            : undefined
        );
        if (res.data && res.data.success && Array.isArray(res.data.agents)) {
          if (isMounted) dispatch(setMyAgents(res.data.agents));
          // Check if any agent_status is not in allowedStatuses
          const hasPending = res.data.agents.some(
            (agent: any) => !allowedStatuses.includes(agent.agent_status)
          );
          if (hasPending && isMounted) {
            pollingRef.current = setTimeout(fetchAgentsAndMaybePoll, 5000);
          }
        }
      } catch (err) {
        console.error("Error fetching agents:", err);
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

  if (agents.length === 0) {
    return null;
  }

  return (
    <div className="w-full h-full">
      <div className="flex flex-col">
        <div className="lg:text-[22px] text-[18px] font-bold flex justify-between items-center">
          <div>Agents</div>
          <PrimaryButton
            onClick={handleBuildNewAgent}
            className="font-[600] flex items-center justify-center gap-2 min-w-[100px] min-h-[40px] text-[13px]"
          >
            <Plus size={16} className="-ml-1" />
            <span>New Agent</span>
          </PrimaryButton>
        </div>
        <MyAgentsTable />
      </div>
    </div>
  );
}
