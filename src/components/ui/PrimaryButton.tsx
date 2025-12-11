"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function PrimaryButton({
  children,
  className,
  disabled = false,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center justify-center text-center px-[16px] py-[10px] rounded-[12px] font-[500] text-[14px] transition-all duration-300 bg-serene-purple text-white",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:brightness-110",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
