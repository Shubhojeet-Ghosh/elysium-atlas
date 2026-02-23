"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import ChatOptionsDropdown from "@/components/ElysiumAtlas/ChatOptionsDropdown";

interface ChatMoreOptionsProps {
  textColor?: string;
}

export default function ChatMoreOptions({ textColor }: ChatMoreOptionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className="p-1.5 text-gray-400 hover:outline-[2px] outline-gray-100 rounded-full transition-colors cursor-pointer"
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreVertical size={14} color={textColor} />
      </button>
      <ChatOptionsDropdown open={open} onNewChat={() => setOpen(false)} />
    </div>
  );
}
