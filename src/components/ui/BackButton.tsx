"use client";
import React from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export default function BackButton({
  children,
  className,
  ...props
}: BackButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center justify-center gap-2 px-[16px] py-[10px] rounded-[12px] font-medium text-[14px] cursor-pointer transition-all duration-300 bg-white dark:bg-deep-onyx text-deep-onyx dark:text-pure-mist outline outline-gray-300 dark:outline-deep-onyx",
        className
      )}
      {...props}
    >
      <span className="flex items-center justify-center text-[22px] leading-none text-gray-400 dark:text-pure-mist">
        {"<"}
      </span>
      <span>{children}</span>
    </button>
  );
}
