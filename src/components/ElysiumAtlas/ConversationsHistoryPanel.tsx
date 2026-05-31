"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/store";
import { useTeamMemberChatSessions } from "@/hooks/useTeamMemberChatSessions";
import ConversationsHistoryHeader from "./ConversationsHistory/ConversationsHistoryHeader";
import ConversationsHistoryBody from "./ConversationsHistory/ConversationsHistoryBody";

export default function ConversationsHistoryPanel() {
  const agentID = useAppSelector((state) => state.agent.agentID);
  const conversationLogs = useAppSelector(
    (state) => state.agent.team_member_conversation_logs,
  );
  const { fetchSessions, page, hasNext, loading, initialLoaded } =
    useTeamMemberChatSessions();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded || !agentID) return;
    fetchSessions(1, { replace: true });
  }, [isExpanded, agentID, fetchSessions]);

  const totalUnread = conversationLogs.reduce(
    (acc, l) => acc + (l.unread_count ?? 0),
    0,
  );

  const hasCollapsedUnread = conversationLogs.some(
    (l) => l.is_unread || (l.unread_count ?? 0) > 0,
  );

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

      {isExpanded && (
        <ConversationsHistoryBody
          fetchSessions={fetchSessions}
          page={page}
          hasNext={hasNext}
          loading={loading}
          initialLoaded={initialLoaded}
        />
      )}
    </div>
  );
}
