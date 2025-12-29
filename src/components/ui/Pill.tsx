"use client";

import { cn } from "@/lib/utils";

interface SupportedFileTypesPillProps {
  item?: string;
  className?: string;
}

export default function SupportedFileTypesPill({
  item = "pdf",
  className,
}: SupportedFileTypesPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-serene-purple/10 dark:bg-pure-mist  text-gray-700 dark:text-deep-onyx",
        className
      )}
    >
      {item}
    </div>
  );
}
