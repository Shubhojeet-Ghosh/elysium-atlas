import { useState } from "react";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import InfoIcon from "@/components/ui/InfoIcon";
import { useAppSelector, useAppDispatch } from "@/store";
import { setSystemPrompt } from "@/store/reducers/agentSlice";

export default function SystemPrompt() {
  const systemPrompt = useAppSelector((state) => state.agent.systemPrompt);
  const dispatch = useAppDispatch();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <label className="text-[14px] font-[600] text-deep-onyx dark:text-pure-mist">
            System Prompt
          </label>
          <InfoIcon text="The system prompt defines the AI's role, behavior, and initial instructions for generating responses." />
        </div>
        <p className="text-[14px] font-[500] text-gray-500 dark:text-gray-400 mt-[2px]">
          The system prompt defines the AI's role, behavior, and initial
          instructions for generating responses.
        </p>
      </div>

      <CustomTextareaPrimary
        placeholder="Enter your system prompt here..."
        value={systemPrompt}
        onChange={(e) => dispatch(setSystemPrompt(e.target.value))}
        rows={6}
      />
    </div>
  );
}
