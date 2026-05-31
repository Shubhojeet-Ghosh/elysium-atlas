"use client";

import { RefreshCw } from "lucide-react";
import aiSocket from "@/lib/aiSocket";
import { useAppDispatch, useAppSelector } from "@/store";
import { triggerFetchTeamMemberChatSessions } from "@/store/reducers/agentSlice";
import { readVisitorsPageSize } from "@/lib/config";
import { cn } from "@/lib/utils";

export default function LiveVisitorsRefetchButton({
  className,
}: {
  className?: string;
}) {
  const dispatch = useAppDispatch();
  const agentID = useAppSelector((state) => state.agent.agentID);

  const handleRefetch = () => {
    if (!agentID) return;
    aiSocket.emit("atlas-agent-visitors-list", {
      agent_id: agentID,
      page: 1,
      limit: readVisitorsPageSize(),
    });
    dispatch(triggerFetchTeamMemberChatSessions());
  };

  return (
    <button
      type="button"
      onClick={handleRefetch}
      disabled={!agentID}
      aria-label="Refresh live visitors"
      className={cn(
        "flex items-center justify-center gap-1.5 px-[10px] py-[8px] rounded-[10px] border border-serene-purple text-serene-purple text-[13px] font-medium transition-all duration-200 cursor-pointer hover:bg-serene-purple/10 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      <RefreshCw size={16} />
      <span className="hidden sm:inline">Refresh</span>
    </button>
  );
}
