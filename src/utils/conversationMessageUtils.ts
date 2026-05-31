import fastApiAxios from "@/utils/fastapi_axios";
import type { ConversationMessage } from "@/store/reducers/agentSlice";

/** Messages from team member / agent that the visitor has not read yet */
export function isIncomingMessageUnread(msg: {
  role: string;
  read_at?: string | null;
  _id?: string;
  message_id?: string;
}): boolean {
  return (
    (msg.role === "human" || msg.role === "agent") &&
    !msg.read_at &&
    !!(msg._id || msg.message_id)
  );
}

export function normalizeVisitorChatMessage(raw: Record<string, unknown>) {
  const mongoId = raw._id ? String(raw._id) : undefined;
  const readAt = raw.read_at ? String(raw.read_at) : null;
  return {
    message_id: String(raw.message_id ?? raw._id ?? ""),
    _id: mongoId,
    role: raw.role as "user" | "agent" | "human",
    content: String(raw.content ?? raw.message ?? ""),
    created_at: String(raw.created_at ?? ""),
    read_at: readAt,
  };
}

export function isVisitorMessageUnread(msg: ConversationMessage): boolean {
  return msg.role === "user" && !msg.read_at;
}

/** Index of the first unread visitor message for the "New" separator in agent chat. */
export function findFirstUnreadSeparatorIndex(
  chain: ConversationMessage[],
  unreadCountHint?: number,
): number {
  const hint =
    typeof unreadCountHint === "number" && unreadCountHint > 0
      ? unreadCountHint
      : 0;

  if (hint > 0) {
    let visitorCount = 0;
    for (let i = chain.length - 1; i >= 0; i--) {
      if (chain[i].role === "user") {
        visitorCount++;
        if (visitorCount === hint) return i;
      }
    }
  }

  return chain.findIndex(isVisitorMessageUnread);
}

/** Index of the first unread team/agent message for the visitor "New" separator. */
export function findFirstIncomingUnreadSeparatorIndex(
  chain: Array<{ role: string; read_at?: string | null; _id?: string }>,
): number {
  const unreadCount = chain.filter(isIncomingMessageUnread).length;
  if (unreadCount <= 0) return -1;

  let seen = 0;
  for (let i = chain.length - 1; i >= 0; i--) {
    if (isIncomingMessageUnread(chain[i])) {
      seen++;
      if (seen === unreadCount) return i;
    }
  }

  return chain.findIndex(isIncomingMessageUnread);
}

export function normalizeConversationMessage(
  raw: Record<string, unknown>,
): ConversationMessage {
  const readAt = raw.read_at ? String(raw.read_at) : null;
  return {
    message_id: String(raw.message_id ?? raw._id ?? ""),
    role: raw.role as ConversationMessage["role"],
    content: String(raw.content ?? ""),
    created_at: String(raw.created_at ?? ""),
    read_at: readAt,
    is_read: readAt ? true : undefined,
  };
}

export async function markChatMessageRead(params: {
  message_id: string;
  /** MongoDB message _id when available; null when only message_id exists (e.g. AI responses) */
  _id?: string | null;
  agent_id: string;
  chat_session_id: string;
  /** MongoDB user id of the team member who read the message (agent-side only) */
  read_by?: string;
}): Promise<boolean> {
  if (!params.message_id) return false;

  try {
    const response = await fastApiAxios.post(
      "/elysium-agents/elysium-atlas/agent/v1/mark-chat-message-read",
      {
        ...params,
        _id: params._id ?? null,
      },
    );
    return response.data?.success === true;
  } catch {
    return false;
  }
}
