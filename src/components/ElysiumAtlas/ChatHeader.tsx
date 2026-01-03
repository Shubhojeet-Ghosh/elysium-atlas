"use client";

import { useAppSelector, useAppDispatch } from "@/store";
import Image from "next/image";
import { X } from "lucide-react";
import { setIsAgentOpen } from "@/store/reducers/agentChatSlice";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ChatHeader() {
  const {
    agent_icon,
    agent_name,
    isFetching,
    primary_color,
    secondary_color,
    text_color,
  } = useAppSelector((state) => state.agentChat);
  const dispatch = useAppDispatch();
  return (
    <div
      className="flex items-center justify-between px-[16px] py-[8px] rounded-t-[16px]"
      style={{ backgroundColor: primary_color }}
    >
      <div className="flex items-center gap-[10px]">
        {isFetching ? (
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
        ) : agent_icon ? (
          <Image
            src={agent_icon}
            alt={agent_name || "Agent"}
            width={108}
            height={108}
            className="rounded-full w-[32px] h-[32px] object-cover"
            quality={100}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-semibold text-sm"
            style={{ backgroundColor: text_color, color: primary_color }}
          >
            {agent_name?.charAt(0)?.toUpperCase() || "A"}
          </div>
        )}
        {isFetching ? (
          <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <span
            className="font-semibold text-gray-700 text-sm"
            style={{ color: text_color }}
          >
            {agent_name || "Agent"}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-1.5 text-gray-400 hover:outline-[2px] outline-gray-100 rounded-full transition-colors cursor-pointer"
                onClick={() => dispatch(setIsAgentOpen(false))}
              >
                <X size={14} color={text_color} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>minimize agent</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
