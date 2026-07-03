import aiSocket from "@/lib/aiSocket";

/** Start human takeover — do not emit stop-monitor first (server handles transition). */
export function emitStartTakeoverConversation(
  agent_id: string,
  chat_session_id: string,
) {
  if (!agent_id || !chat_session_id) return;

  aiSocket.emit("atlas-team-member-start-conversation", {
    agent_id,
    chat_session_id,
  });
}

/** End human takeover — visitor returns to AI chat. */
export function emitEndTakeoverConversation(
  agent_id: string,
  chat_session_id: string,
) {
  if (!agent_id || !chat_session_id) return;

  aiSocket.emit("atlas-team-member-end-conversation", {
    agent_id,
    chat_session_id,
  });
}

/** Mark session resolved — ends takeover and closes the chat session. */
export function emitResolveSession(agent_id: string, chat_session_id: string) {
  if (!agent_id || !chat_session_id) return;

  aiSocket.emit("atlas-team-member-resolve-session", {
    agent_id,
    chat_session_id,
  });
}

/** Idempotent ack when this team member already owns takeover (e.g. reconnect). */
export function reackOwnedTakeoverSessions(
  agent_id: string,
  chat_session_ids: Iterable<string>,
) {
  if (!agent_id) return;

  const seen = new Set<string>();
  for (const chat_session_id of chat_session_ids) {
    if (!chat_session_id || seen.has(chat_session_id)) continue;
    seen.add(chat_session_id);
    emitStartTakeoverConversation(agent_id, chat_session_id);
  }
}
