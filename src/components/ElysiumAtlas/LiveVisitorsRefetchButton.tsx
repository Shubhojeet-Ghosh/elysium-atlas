"use client";

import { memo } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import Spinner from "@/components/ui/Spinner";

export default memo(function LiveVisitorsRefetchButton({
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
        "flex shrink-0 items-center justify-center size-[41px] min-w-[41px] min-h-[41px] p-0 box-border rounded-[10px] border-2 border-serene-purple text-serene-purple transition-all duration-200 cursor-pointer hover:bg-serene-purple/10 disabled:opacity-50 disabled:cursor-not-allowed",
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
});
