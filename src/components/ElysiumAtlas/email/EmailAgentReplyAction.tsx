"use client";

import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import type { EmailReplyActionMode } from "@/utils/emailAiAgentsApi";

interface EmailAgentReplyActionProps {
  mode: EmailReplyActionMode;
  autoSendMinConfidence: number;
  onModeChange: (mode: EmailReplyActionMode) => void;
  onConfidenceChange: (value: number) => void;
}

const REPLY_MODES: {
  value: EmailReplyActionMode;
  label: string;
  description: string;
}[] = [
  {
    value: "draft",
    label: "Save as draft",
    description:
      "The reply is saved in Gmail as a draft. You read it and send it when you're ready.",
  },
  {
    value: "auto_send",
    label: "Send automatically",
    description:
      "The reply is sent for you when the AI is confident enough. Otherwise, it is saved as a draft.",
  },
];

export default function EmailAgentReplyAction({
  mode,
  autoSendMinConfidence,
  onModeChange,
  onConfidenceChange,
}: EmailAgentReplyActionProps) {
  return (
    <div className="flex flex-col gap-[8px]">
      <div>
        <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
          How replies are sent
        </p>
        <p className="text-[12px] text-gray-500 ml-[2px] mt-[2px]">
          Choose whether the AI saves replies for you to review or sends them for
          you.
        </p>
      </div>

      <div className="flex flex-col gap-[8px]">
        {REPLY_MODES.map((option) => {
          const isSelected = mode === option.value;

          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors",
                isSelected
                  ? "border-serene-purple bg-serene-purple/5"
                  : "border-gray-200 hover:border-gray-300",
              )}
            >
              <input
                type="radio"
                name="reply-action-mode"
                value={option.value}
                checked={isSelected}
                onChange={() => onModeChange(option.value)}
                className="mt-[3px] h-4 w-4 shrink-0 accent-serene-purple cursor-pointer"
              />
              <div className="flex flex-col gap-[2px]">
                <span className="text-[13px] font-[600] text-gray-800">
                  {option.label}
                </span>
                <span className="text-[12px] text-gray-500 leading-snug">
                  {option.description}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      {mode === "auto_send" && (
        <div className="rounded-lg border border-gray-200 px-3 py-3 mt-[4px]">
          <label className="text-sm font-medium text-gray-800">
            How sure should the AI be before sending?
          </label>
          <p className="text-xs text-muted-foreground mt-[16px]">
            Higher value means the AI sends only when it is more sure of the
            reply.
          </p>
          <Slider
            value={[autoSendMinConfidence]}
            onValueChange={(value) => onConfidenceChange(value[0])}
            max={1.0}
            min={0.0}
            step={0.01}
            className={cn("w-full mt-[10px] cursor-pointer")}
          />
          <p className="text-xs text-muted-foreground mt-[10px]">
            Send when the AI is at least{" "}
            <span className="font-[600] text-gray-700">
              {Math.round(autoSendMinConfidence * 100)}%
            </span>{" "}
            sure.
          </p>
        </div>
      )}
    </div>
  );
}
