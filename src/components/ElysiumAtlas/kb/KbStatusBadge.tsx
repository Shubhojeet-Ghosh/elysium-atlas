import Badge from "@/components/ui/Badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookOpen } from "lucide-react";
import type { AgentKbDisplayStatus } from "@/utils/agentKbUtils";
import type { KbItemStatus } from "@/types/kbItems";

export type KbStatusBadgeValue =
  | AgentKbDisplayStatus
  | KbItemStatus
  | "pending"
  | "indexed"
  | "active"
  | "error";

function normalizeStatus(status: KbStatusBadgeValue): AgentKbDisplayStatus | null {
  if (status === "pending") return "from_library";
  if (status === "indexed" || status === "active") return "ready";
  if (status === "error") return "failed";
  if (
    status === "new" ||
    status === "from_library" ||
    status === "indexing" ||
    status === "draft" ||
    status === "ready" ||
    status === "failed"
  ) {
    return status;
  }
  return null;
}

interface KbStatusBadgeProps {
  status: KbStatusBadgeValue;
  mode?: "agent" | "team";
}

export default function KbStatusBadge({
  status,
  mode: _mode = "agent",
}: KbStatusBadgeProps) {
  const normalized = normalizeStatus(status);
  if (!normalized) return null;

  if (normalized === "new") {
    return <Badge>New</Badge>;
  }

  if (normalized === "from_library") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="shrink-0 inline-flex text-serene-purple dark:text-[#c4bcd6]"
            aria-label="From library"
          >
            <BookOpen size={14} />
          </span>
        </TooltipTrigger>
        <TooltipContent>From library</TooltipContent>
      </Tooltip>
    );
  }

  if (normalized === "ready") {
    return null;
  }

  if (normalized === "indexing" || normalized === "draft") {
    return (
      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 inline-flex items-center gap-px bg-serene-purple/10 text-serene-purple dark:bg-serene-purple/20 dark:text-[#c4bcd6]">
        <span className="inline-flex items-center gap-[2px]">
          <span>{normalized === "draft" ? "Draft" : "Indexing"}</span>
          {normalized === "indexing" && (
            <span className="inline-flex items-end gap-[2px] ml-[2px]">
              {[0, 0.2, 0.4].map((delay, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    width: "3px",
                    height: "3px",
                    borderRadius: "50%",
                    background: "currentColor",
                    animation: `bounce-dot 1.2s ${delay}s infinite ease-in-out`,
                  }}
                />
              ))}
            </span>
          )}
        </span>
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
      Failed
    </span>
  );
}
