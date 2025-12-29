interface AgentStatusPillProps {
  status: string;
  className?: string;
}

export function AgentStatusPill({
  status,
  className = "",
}: AgentStatusPillProps) {
  const pillClass =
    "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200 dark:from-slate-800/50 dark:to-slate-700/50 dark:text-slate-300 dark:border-slate-600/50";

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
