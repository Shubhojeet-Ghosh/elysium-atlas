"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentBackButtonProps {
  onBack: () => void;
  className?: string;
}

export default function AgentBackButton({
  onBack,
  className,
}: AgentBackButtonProps) {
  return (
    <button
      onClick={onBack}
      className={cn(
        "flex items-center justify-center px-[10px] py-[8px] rounded-[10px] border border-serene-purple text-serene-purple transition-all duration-200 cursor-pointer hover:bg-serene-purple/10",
        className,
      )}
    >
      <ArrowLeft size={16} />
    </button>
  );
}
