import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-semibold rounded-full bg-serene-purple/80 text-white shrink-0 ${className}`}
    >
      {children}
    </span>
  );
}
