"use client";
import { useEffect, useState } from "react";

import AgentLeftSide from "./AgentLeftSide";
import AgentRightSide from "./AgentRightSide";
import PrimaryButton from "../ui/PrimaryButton";
import { useAppSelector } from "../../store";

interface AgentMainContentProps {
  initialAgentDetails: any;
  onSave: () => void;
}

export default function AgentMainContent({
  initialAgentDetails,
  onSave,
}: AgentMainContentProps) {
  const agentID = useAppSelector((state) => state.agent.agentID);

  const handlePreview = () => {
    const chatSessionId = "app-" + crypto.randomUUID();
    const url = `/chat-with-agent?agent_id=${agentID}&chat_session_id=${chatSessionId}`;
    window.open(url, "_blank");
  };
  return (
    <>
      <div className="flex flex-col lg:px-[40px] px-0">
        <div className="lg:mt-[40px] mt-[20px] flex items-center justify-between">
          <p className="text-[24px] font-[700]">Agent</p>
          <PrimaryButton className="text-[13px]" onClick={handlePreview}>
            Preview Agent
          </PrimaryButton>
        </div>
        <div className="flex lg:flex-row flex-col gap-[30px] mt-[30px]">
          <AgentLeftSide />
          <AgentRightSide />
        </div>
      </div>
    </>
  );
}
