// components/ui/Spinner.tsx
import React from "react";

export default function Spinner({ className = "" }) {
  return (
    <div
      className={`w-4 h-4 border-[3px] border-t-transparent dark:border-t-pure-mist rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
