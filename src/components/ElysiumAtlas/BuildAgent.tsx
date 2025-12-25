"use client";
import CreateAgentCard from "@/components/ElysiumAtlas/CreateAgentCard";
import LogoComponent from "./LogoComponent";
import { useAppSelector } from "@/store";

export default function BuildAgent() {
  const agents = useAppSelector((state) => state.userAgents.myAgents);

  if (agents.length > 0) {
    return null;
  }
  return (
    <div className="w-full h-full">
      <div className=" flex flex-col">
        <div className="lg:text-[22px] text-[18px] font-bold flex flex-wrap items-center gap-1 md:gap-2">
          Welcome to{" "}
          <span className="mx-[2px]">
            <LogoComponent />
          </span>
          Agents
        </div>
        <div className="lg:text-[16px] text-[14px] text-gray-500 font-medium mt-1 md:mt-2 lg:mt-[4px]">
          Shall we build your first agent?
        </div>
        <div className="mt-6 md:mt-8 lg:mt-[40px]">
          <CreateAgentCard />
        </div>
      </div>
    </div>
  );
}
