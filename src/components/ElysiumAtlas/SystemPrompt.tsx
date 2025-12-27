import { useState } from "react";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import InfoIcon from "@/components/ui/InfoIcon";

export default function SystemPrompt() {
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant."
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <label className="text-[14px] font-[600] text-deep-onyx dark:text-pure-mist">
          System Prompt
        </label>
        <InfoIcon text="The system prompt defines the AI's role, behavior, and initial instructions for generating responses." />
      </div>
      <CustomTextareaPrimary
        placeholder="Enter your system prompt here..."
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        rows={6}
      />
    </div>
  );
}
