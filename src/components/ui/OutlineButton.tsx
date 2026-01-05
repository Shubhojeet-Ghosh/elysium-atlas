"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface OutlineButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function OutlineButton({
  children,
  className,
  disabled = false,
  ...props
}: OutlineButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center justify-center text-center px-[16px] py-[10px] rounded-[12px] font-bold text-[14px] transition-all duration-300 border-[2px] border-serene-purple text-serene-purple ",
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
