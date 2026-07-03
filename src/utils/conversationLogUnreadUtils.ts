import type { TeamMemberConversationLog } from "@/store/reducers/agentSlice";

type CapturedSessionLike = {
  chat_session_id: string;
  is_expanded: boolean;
};

/** Unread for UI when the session is not open in the chat panel. */
export function isConversationLogUnreadForDisplay(
  log: Pick<TeamMemberConversationLog, "chat_session_id" | "is_unread" | "unread_count">,
  capturedSessions: CapturedSessionLike[],
): boolean {
  const captured = capturedSessions.find(
    (session) => session.chat_session_id === log.chat_session_id,
  );
  if (captured?.is_expanded) return false;
  return log.is_unread || (log.unread_count ?? 0) > 0;
}

export function countDisplayUnreadForLogs(
  logs: Pick<TeamMemberConversationLog, "chat_session_id" | "is_unread" | "unread_count">[],
  capturedSessions: CapturedSessionLike[],
): number {
  return logs.reduce((acc, log) => {
    if (!isConversationLogUnreadForDisplay(log, capturedSessions)) return acc;
    return acc + (log.unread_count ?? 0);
  }, 0);
}

export function hasDisplayUnreadForLogs(
  logs: Pick<TeamMemberConversationLog, "chat_session_id" | "is_unread" | "unread_count">[],
  capturedSessions: CapturedSessionLike[],
): boolean {
  return logs.some((log) =>
    isConversationLogUnreadForDisplay(log, capturedSessions),
  );
}
