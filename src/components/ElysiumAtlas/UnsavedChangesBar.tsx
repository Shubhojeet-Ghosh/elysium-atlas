import React, { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import OutlineButton from "@/components/ui/OutlineButton";
import PrimaryButton from "@/components/ui/PrimaryButton";

interface UnsavedChangesBarProps {
  initial: any;
  current: any;
  onSave: () => void;
  onClear: () => void;
}

function deepEqual(obj1: any, obj2: any): boolean {
  // Simple deep equality check (can be replaced with lodash.isEqual if needed)
  if (obj1 === obj2) return true;
  if (typeof obj1 !== typeof obj2) return false;
  if (typeof obj1 !== "object" || obj1 === null || obj2 === null) return false;
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  return true;
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
    const isDiff = initial && current && !deepEqual(initial, current);
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
          "gap-[42px] flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-3 md:px-6 px-[8px] shadow-lg md:min-w-[400px] min-w-[360px]"
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
          <OutlineButton className="text-[12px]" onClick={onClear}>
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
