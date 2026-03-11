"use client";

import { useState } from "react";
import { useAppSelector } from "@/store";
import ConversationsHistoryHeader from "./ConversationsHistory/ConversationsHistoryHeader";
import ConversationsHistoryBody from "./ConversationsHistory/ConversationsHistoryBody";

export default function ConversationsHistoryPanel() {
  const conversationLogs = useAppSelector(
    (state) => state.agent.team_member_conversation_logs,
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const totalUnread = conversationLogs.reduce(
    (acc, l) => acc + (l.unread_count ?? 0),
    0,
  );

  // Legacy desktop behavior: look at collapsed live chat sessions.
  const hasCollapsedUnreadFromCaptured = useAppSelector((state) =>
    state.agent.captured_sessions.some(
      (s) =>
        !s.is_expanded && s.conversation_chain.some((m) => m.is_read === false),
    ),
  );

  // Also consider unread_count on logs so mobile (where chat dialogs unmount
  // when minimized) still shows the purple dot based on server log state.
  const hasCollapsedUnread = hasCollapsedUnreadFromCaptured || totalUnread > 0;

  return (
    <div
      className={`pointer-events-auto bg-white dark:bg-deep-onyx border border-serene-purple dark:border-pure-mist rounded-t-xl shadow-2xl flex flex-col overflow-hidden transition-[height,width] duration-300 ease-in-out ${
        isExpanded ? "w-64 lg:w-80 h-[480px]" : "w-64 lg:w-80 h-12"
      }`}
    >
      <ConversationsHistoryHeader
        isExpanded={isExpanded}
        totalUnread={totalUnread}
        hasCollapsedUnread={hasCollapsedUnread}
        onToggle={() => setIsExpanded((v) => !v)}
      />

      {isExpanded && <ConversationsHistoryBody />}
    </div>
  );
}
