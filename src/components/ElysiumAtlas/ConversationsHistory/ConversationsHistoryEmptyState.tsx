"use client";

import UserAvatar from "@/components/ElysiumAtlas/UserAvatar";

export default function ConversationsHistoryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-10 gap-3 text-center">
      <div className=" flex items-center justify-center">
        <UserAvatar />
      </div>
      <p className="text-[14px] font-semibold text-gray-600 dark:text-gray-400">
        No conversations yet
      </p>
      <p className="text-[13px] text-gray-400 dark:text-gray-500 leading-relaxed">
        You haven&#39;t had any conversations yet. Start engaging with your
        visitors to see them appear here.
      </p>
    </div>
  );
}
