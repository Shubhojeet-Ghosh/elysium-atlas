"use client";
import { useEffect, useState } from "react";

import AgentLeftSide from "./AgentLeftSide";
import AgentRightSide from "./AgentRightSide";
import AgentReadyCard from "./AgentReadyCard";
import AgentEmbedCard from "./AgentEmbedCard";
import AgentProgressCard from "./AgentProgressCard";
import DeleteAgentCard from "./DeleteAgentCard";
import { useAppSelector } from "../../store";

interface AgentMainContentProps {
  initialAgentDetails: any;
  onSave: () => void;
}

export default function AgentMainContent({
  initialAgentDetails,
  onSave,
}: AgentMainContentProps) {
  const widgetScript = useAppSelector((state) => state.agent.widget_script);
  const agentName = useAppSelector((state) => state.agent.agentName);
  const agentStatus = useAppSelector((state) => state.agent.agent_status);
  const agentCurrentTask = useAppSelector(
    (state) => state.agent.agent_current_task,
  );
  const progress = useAppSelector((state) => state.agent.progress);

  const allowedStatuses = ["active", "failed", "inactive"];
  const isAgentInProgress = !allowedStatuses.includes(agentStatus);

  return (
    <>
      <div className="flex flex-col lg:px-[40px] px-0">
        <div className="lg:mt-[40px] mt-[20px] flex items-center justify-between">
          <p className="text-[24px] font-[700]">{agentName || "Agent"}</p>
        </div>
        {isAgentInProgress && (
          <div className="w-full flex items-center lg:mt-0 mt-[20px] justify-end">
            <AgentProgressCard />
          </div>
        )}
        {widgetScript && !isAgentInProgress && (
          <div className="w-full flex lg:flex-row md:flex-row flex-col lg:mt-0 md:mt-[20px] mt-[20px] lg:items-stretch lg:justify-end md:items-stretch md:justify-end justify-center items-center gap-4">
            <AgentEmbedCard />
            <AgentReadyCard />
          </div>
        )}
        <div className="flex lg:flex-row flex-col gap-[30px] mt-[30px]">
          <AgentLeftSide />
          <AgentRightSide />
        </div>
        <div className="flex lg:flex-row md:flex-row flex-col mt-[40px] mb-[10px] lg:justify-start md:justify-start justify-center items-start">
          <DeleteAgentCard />
        </div>
      </div>
    </>
  );
}
