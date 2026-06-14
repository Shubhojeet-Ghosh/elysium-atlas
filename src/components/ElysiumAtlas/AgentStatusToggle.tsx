"use client";

import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAgentStatus } from "@/store/reducers/agentSlice";
import {
  isSettledAgentStatus,
  isToggleableAgentStatus,
} from "@/utils/agentStatus";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";

export default function AgentStatusToggle() {
  const dispatch = useAppDispatch();
  const readOnly = useAgentReadOnly();
  const agentStatus = useAppSelector((state) => state.agent.agent_status);

  const isActive = agentStatus.toLowerCase() === "active";
  const canToggle = isToggleableAgentStatus(agentStatus);
  const isDisabled = readOnly || !canToggle;

  if (!isSettledAgentStatus(agentStatus)) {
    return null;
  }

  const handleToggle = () => {
    if (isDisabled) return;
    dispatch(setAgentStatus(isActive ? "disabled" : "active"));
  };

  return (
    <div className="flex items-center shrink-0 pl-4 border-l border-gray-200 dark:border-gray-700">
      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-label={isActive ? "Disable agent" : "Enable agent"}
        disabled={isDisabled}
        onClick={handleToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serene-purple/50",
          isActive ? "bg-serene-purple" : "bg-gray-300 dark:bg-gray-600",
          isDisabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
            isActive ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
