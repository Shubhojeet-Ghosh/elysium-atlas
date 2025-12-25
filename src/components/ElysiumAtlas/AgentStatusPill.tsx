interface AgentStatusPillProps {
  status: string;
  className?: string;
}

export function AgentStatusPill({
  status,
  className = "",
}: AgentStatusPillProps) {
  let pillClass =
    "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200 dark:from-slate-800/50 dark:to-slate-700/50 dark:text-slate-300 dark:border-slate-600/50";

  if (status === "active") {
    pillClass =
      "bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-700 border border-emerald-200 dark:from-emerald-900/20 dark:to-green-900/30 dark:text-emerald-300 dark:border-emerald-700/50";
  } else if (status === "failed") {
    pillClass =
      "bg-gradient-to-r from-red-50 to-rose-100 text-red-700 border border-red-200 dark:from-red-900/20 dark:to-rose-900/30 dark:text-red-300 dark:border-red-700/50";
  } else if (status === "inactive") {
    pillClass =
      "bg-gradient-to-r from-amber-50 to-yellow-100 text-amber-700 border border-amber-200 dark:from-amber-900/20 dark:to-yellow-900/30 dark:text-amber-300 dark:border-amber-700/50";
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${pillClass} ${className}`}
    >
      <span className="flex items-center justify-center h-full capitalize tracking-wide">
        {status}
      </span>
    </span>
  );
}
