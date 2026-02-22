"use client";

import { DollarSign } from "lucide-react";
import { useAppSelector } from "@/store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const statusPill: Record<string, { label: string; className: string }> = {
  trialing: {
    label: "Trial",
    className: "bg-teal-green/10 text-teal-green",
  },
  expired: {
    label: "Expired",
    className: "bg-danger-red/10 text-danger-red",
  },
};

export default function PlanBadge() {
  const plan = useAppSelector((state: any) => state.userPlan.plan);

  if (!plan?.plan_name) return null;

  const pill = plan.status ? statusPill[plan.status] : null;

  return (
    <div className="flex items-center justify-between px-2 py-1.5 gap-2">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 shrink-0" />
        <span className="text-[12px] font-medium">{plan.plan_name}</span>
        {pill && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${pill.className}`}
          >
            {pill.label}
          </span>
        )}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default">
            <button className="text-[11px] font-medium px-2 py-0.5 rounded bg-serene-purple text-pure-mist transition-colors hover:opacity-90 pointer-events-none">
              Upgrade
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Coming Soon</TooltipContent>
      </Tooltip>
    </div>
  );
}
