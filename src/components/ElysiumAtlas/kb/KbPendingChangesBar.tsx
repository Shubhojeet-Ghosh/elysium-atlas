"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import NProgress from "nprogress";
import { cn } from "@/lib/utils";
import OutlineButton from "@/components/ui/OutlineButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import { useKbPendingSnapshot } from "./KbPendingChangesContext";

export default function KbPendingChangesBar() {
  const { hasPending, pendingCount, version, runIndexAll, runClearAll } =
    useKbPendingSnapshot();
  const [show, setShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  useEffect(() => {
    if (hasPending) {
      const showTimer = setTimeout(() => {
        setShow(true);
        setTimeout(() => setIsVisible(true), 10);
      }, 100);

      return () => clearTimeout(showTimer);
    }

    setIsVisible(false);
    const hideTimer = setTimeout(() => setShow(false), 300);
    return () => clearTimeout(hideTimer);
  }, [hasPending, version]);

  if (!show) return null;

  const countLabel =
    pendingCount === 1
      ? "1 item ready to index"
      : `${pendingCount} items ready to index`;

  const handleIndex = async () => {
    setIsIndexing(true);
    NProgress.start();
    try {
      await runIndexAll();
    } finally {
      setIsIndexing(false);
      NProgress.done();
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-[10px] left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      )}
    >
      <div className="gap-[42px] flex items-center justify-between bg-pure-mist dark:bg-black shadow-lg rounded-lg py-3 md:px-6 px-[8px] md:min-w-[420px] min-w-[360px]">
        <div className="flex items-center gap-[8px] min-w-0">
          <Layers className="w-4 h-4 shrink-0" />
          <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate lg:block hidden">
            {countLabel}
          </span>
          <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100 lg:hidden block">
            Ready to index
          </span>
        </div>

        <div className="flex justify-center items-center gap-3 shrink-0">
          <OutlineButton
            className="text-[12px] font-bold"
            onClick={runClearAll}
            disabled={isIndexing}
          >
            Clear
          </OutlineButton>
          <PrimaryButton
            className="min-w-[80px] text-[12px] font-bold flex items-center justify-center gap-2 py-[11px]"
            onClick={handleIndex}
            disabled={isIndexing}
          >
            {isIndexing ? (
              <Spinner className="h-3.5 w-3.5 border-white dark:border-deep-onyx" />
            ) : (
              "Index"
            )}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
