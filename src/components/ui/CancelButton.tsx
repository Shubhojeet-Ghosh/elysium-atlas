"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface CancelButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function CancelButton({
  children,
  className,
  disabled = false,
  ...props
}: CancelButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center justify-center text-center px-[16px] py-[10px] rounded-[12px] font-[500] text-[14px] transition-all duration-300 bg-white dark:bg-black text-gray-deep-onyx dark:text-white dark:hover:text-deep-onyx border border-gray-400 dark:border-white hover:bg-gray-50 dark:hover:bg-white transition-colors",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
