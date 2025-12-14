"use client";
import { Info } from "lucide-react";
import CustomTooltip from "./CustomTooltip";

interface InfoIconProps {
  text: string;
  className?: string;
  iconSize?: number;
}

export default function InfoIcon({
  text,
  className = "",
  iconSize = 16,
}: InfoIconProps) {
  return (
    <CustomTooltip content={text} position="top" className={className}>
      <Info
        size={iconSize}
        className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 cursor-help hover:text-serene-purple dark:hover:text-serene-purple transition-colors"
      />
    </CustomTooltip>
  );
}
