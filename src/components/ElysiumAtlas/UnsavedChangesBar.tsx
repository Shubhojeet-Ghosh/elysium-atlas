import React, { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import OutlineButton from "@/components/ui/OutlineButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { deepEqualNormalizedIgnoringExisting } from "@/utils/comparisonUtils";

interface UnsavedChangesBarProps {
  initial: any;
  current: any;
  onSave: () => void;
  onClear: () => void;
}
export default function UnsavedChangesBar({
  initial,
  current,
  onSave,
  onClear,
}: UnsavedChangesBarProps) {
  const [show, setShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDiff =
      initial &&
      current &&
      !deepEqualNormalizedIgnoringExisting(initial, current);
    // Debug logs
    // console.log("[UnsavedChangesBar] initial:", initial);
    // console.log("[UnsavedChangesBar] current:", current);
    // console.log("[UnsavedChangesBar] show:", isDiff);

    if (isDiff) {
      setShow(true);
      // Small delay to trigger the fade-in animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // Delay hiding the component to allow fade-out animation
      setTimeout(() => setShow(false), 300);
    }
  }, [initial, current]);

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed bottom-[10px] left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div
        className={cn(
          "gap-[42px] flex items-center justify-between bg-pure-mist dark:bg-black shadow-lg rounded-lg py-3 md:px-6 px-[8px] shadow-lg md:min-w-[400px] min-w-[360px]"
        )}
      >
        <div className="flex items-center gap-[8px]">
          <TriangleAlert className="w-4 h-4" />
          <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100 lg:block md:block hidden">
            You have unsaved changes
          </span>
          <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100 lg:hidden md:hidden block">
            Save changes
          </span>
        </div>

        <div className="flex justify-center items-center gap-3">
          <OutlineButton className="text-[12px] font-bold" onClick={onClear}>
            Clear
          </OutlineButton>
          <PrimaryButton
            className="min-w-[80px] text-[12px] font-bold flex items-center justify-center gap-2 py-[11px]"
            onClick={onSave}
          >
            Save
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
