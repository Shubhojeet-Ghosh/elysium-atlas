"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setCurrentStep } from "@/store/reducers/agentBuilderSlice";
import ChatInterface from "./ChatInterface";

export default function CreateAgentCard() {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleCreateAgent = () => {
    dispatch(setCurrentStep(1));
    router.push("/my-agents/build");
  };

  return (
    <div
      className="relative group cursor-pointer max-w-[400px] mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCreateAgent}
    >
      <div
        className={`
          relative cursor-pointer
          bg-white dark:bg-deep-onyx
          border-[1px] border-gray-200 hover:border-deep-onyx dark:border-white dark:hover:border-serene-purple
          rounded-xl
          transition-all duration-300 ease-in-out
          ${
            isHovered ? "border-serene-purple" : "hover:border-serene-purple/50"
          }
        `}
      >
        <ChatInterface onCTAClick={handleCreateAgent} />
      </div>
    </div>
  );
}
