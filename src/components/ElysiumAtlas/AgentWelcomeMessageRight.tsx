"use client";

import { useAppDispatch, useAppSelector } from "@/store";
import { setWelcomeMessage } from "@/store/reducers/agentSlice";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";

export default function AgentWelcomeMessageRight() {
  const dispatch = useAppDispatch();
  const welcomeMessage = useAppSelector((state) => state.agent.welcomeMessage);

  return (
    <div className="lg:w-[60%] w-full flex flex-col items-start lg:items-center p-[24px] gap-[20px]">
      <div className="w-full max-w-[480px]">
        <CustomTextareaPrimary
          placeholder="e.g. Hi there! How can I help you today?"
          value={welcomeMessage}
          onChange={(e) => dispatch(setWelcomeMessage(e.target.value))}
          rows={4}
          resizable={true}
        />
      </div>
    </div>
  );
}
