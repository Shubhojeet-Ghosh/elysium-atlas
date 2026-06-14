"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import ChatOptionsDropdown from "@/components/ElysiumAtlas/ChatOptionsDropdown";

interface ChatMoreOptionsProps {
  textColor?: string;
  disabled?: boolean;
}

export default function ChatMoreOptions({
  textColor,
  disabled = false,
}: ChatMoreOptionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={`p-1.5 text-gray-400 rounded-full transition-colors ${
          disabled
            ? "cursor-not-allowed opacity-40"
            : "hover:outline-[2px] outline-gray-100 cursor-pointer"
        }`}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        disabled={disabled}
        aria-disabled={disabled}
      >
        <MoreVertical size={14} color={textColor} />
      </button>
      {!disabled && (
        <ChatOptionsDropdown open={open} onNewChat={() => setOpen(false)} />
      )}
    </div>
  );
}
