"use client";
import { useEffect, useState } from "react";

import AgentLeftSide from "./AgentLeftSide";
import AgentRightSide from "./AgentRightSide";

interface AgentMainContentProps {
  initialAgentDetails: any;
  onSave: () => void;
}

export default function AgentMainContent({
  initialAgentDetails,
  onSave,
}: AgentMainContentProps) {
  return (
    <>
      <div className="flex flex-col lg:px-[40px] px-0">
        <div className="lg:mt-[40px] mt-[20px]">
          <p className="text-[24px] font-[700]">Agent</p>
        </div>
        <div className="flex lg:flex-row flex-col gap-[30px] mt-[30px]">
          <AgentLeftSide />
          <AgentRightSide />
        </div>
      </div>
    </>
  );
}
