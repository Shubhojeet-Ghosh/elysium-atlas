"use client";

import { useAppSelector, useAppDispatch } from "@/store";
import Image from "next/image";
import { X } from "lucide-react";
import { setIsAgentOpen } from "@/store/reducers/agentChatSlice";
import ChatMoreOptions from "@/components/ElysiumAtlas/ChatMoreOptions";

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

  const handleClose = () => {
    dispatch(setIsAgentOpen(false));
    window.parent.postMessage({ type: "close_chat" }, "*");
  };
  return (
    <div
      className="flex items-center justify-between px-[16px] py-[8px] lg:rounded-t-[16px] md:rounded-t-none rounded-t-none"
      style={{ backgroundColor: primary_color }}
    >
      <div className="flex items-center gap-[10px]">
        {isFetching ? (
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
        ) : agent_icon ? (
          <Image
            src={agent_icon}
            alt={agent_name || "Agent"}
            width={32}
            height={32}
            className="rounded-full w-[30px] h-[30px] object-cover"
            quality={100}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-semibold text-sm shadow-sm"
            style={{ backgroundColor: primary_color, color: text_color }}
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
        <ChatMoreOptions textColor={text_color} />
        <button
          className="p-1.5 text-gray-400 hover:outline-[2px] outline-gray-100 rounded-full transition-colors cursor-pointer"
          onClick={handleClose}
        >
          <X size={14} color={text_color} />
        </button>
      </div>
    </div>
  );
}
