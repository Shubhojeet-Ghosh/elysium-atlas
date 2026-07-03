"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import Spinner from "@/components/ui/Spinner";

export default function LiveVisitorsRefetchButton({
  className,
  disabled,
  isLoading = false,
  onRefresh,
}: {
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onRefresh: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={disabled || isLoading}
      aria-label="Refresh chat sessions"
      aria-busy={isLoading}
      className={cn(
        "flex items-center justify-center px-[10px] py-[8px] rounded-[10px] border border-serene-purple text-serene-purple transition-all duration-200 cursor-pointer hover:bg-serene-purple/10 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {isLoading ? (
        <Spinner className="w-4 h-4 border-2 border-serene-purple dark:border-pure-mist" />
      ) : (
        <RefreshCw size={16} />
      )}
    </button>
  );
}
