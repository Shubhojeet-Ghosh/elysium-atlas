import fastApiAxios from "@/utils/fastapi_axios";
import type { ConversationMessage } from "@/store/reducers/agentSlice";

export function isToolCallMessage(msg: { role?: string }): boolean {
  return msg.role === "tool";
}

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
    role: raw.role as "user" | "agent" | "human" | "system",
    content: String(raw.content ?? raw.message ?? ""),
    created_at: String(raw.created_at ?? ""),
    read_at: readAt,
  };
}

/** True when the chain already contains the same system notice text. */
export function hasSystemNotice(
  chain: Array<{ role: string; content: string }>,
  content: string,
): boolean {
  const normalized = content.trim();
  if (!normalized) return false;

  return chain.some(
    (message) =>
      message.role === "system" && message.content.trim() === normalized,
  );
}

/** Keep the first occurrence of each system notice (e.g. takeover banner). */
export function dedupeSystemNotices<T extends { role: string; content: string }>(
  chain: T[],
): T[] {
  const seen = new Set<string>();

  return chain.filter((message) => {
    if (message.role !== "system") return true;

    const key = message.content.trim();
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export function isVisitorMessageUnread(msg: ConversationMessage): boolean {
  return msg.role === "user" && !msg.read_at;
}

/** Monitor UI: message still needs mark-read (visitor or agent mirror). */
export function isMonitorMessageUnread(msg: ConversationMessage): boolean {
  if (isToolCallMessage(msg)) return false;
  return !msg.read_at && !!(msg._id || msg.message_id);
}

export function isSameConversationMessage(
  a: Pick<ConversationMessage, "_id" | "message_id">,
  b: Pick<ConversationMessage, "_id" | "message_id">,
): boolean {
  if (a._id && b._id) return a._id === b._id;
  if (a.message_id && b.message_id) return a.message_id === b.message_id;
  return false;
}

/** Insert by created_at; skip duplicates. Tool rows sit between visitor and agent replies. */
export function upsertConversationMessage(
  chain: ConversationMessage[],
  message: ConversationMessage,
): ConversationMessage[] {
  if (chain.some((existing) => isSameConversationMessage(existing, message))) {
    return chain;
  }

  const insertTime = Date.parse(message.created_at);
  if (Number.isNaN(insertTime)) {
    return [...chain, message];
  }

  const index = chain.findIndex((existing) => {
    const existingTime = Date.parse(existing.created_at);
    return !Number.isNaN(existingTime) && existingTime > insertTime;
  });

  if (index === -1) return [...chain, message];
  return [...chain.slice(0, index), message, ...chain.slice(index)];
}

export function sortConversationMessages(
  chain: ConversationMessage[],
): ConversationMessage[] {
  return [...chain].sort((a, b) => {
    const aTime = Date.parse(a.created_at);
    const bTime = Date.parse(b.created_at);
    const safeA = Number.isNaN(aTime) ? 0 : aTime;
    const safeB = Number.isNaN(bTime) ? 0 : bTime;
    return safeA - safeB;
  });
}

/**
 * Mongo `_id` preferred for mark-read API `message_id` field (live-visitor-chat.md).
 */
export function resolveMarkReadMessageId(message: {
  _id?: string;
  message_id?: string;
}): string | null {
  if (message._id) return message._id;
  if (message.message_id) return message.message_id;
  return null;
}

/** Index of the first unread visitor message for the "New" separator in agent chat. */
export function findFirstUnreadSeparatorIndex(
  chain: ConversationMessage[],
  unreadCountHint?: number,
): number {
  const byReadState = chain.findIndex(isVisitorMessageUnread);
  if (byReadState !== -1) return byReadState;

  const hint =
    typeof unreadCountHint === "number" && unreadCountHint > 0
      ? unreadCountHint
      : 0;
  if (hint <= 0) return -1;

  let visitorCount = 0;
  for (let i = chain.length - 1; i >= 0; i--) {
    if (chain[i].role === "user") {
      visitorCount++;
      if (visitorCount === hint) return i;
    }
  }

  return -1;
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
  const mongoId = raw._id ? String(raw._id) : undefined;
  const role = (raw.role as ConversationMessage["role"]) ?? "agent";
  const message: ConversationMessage = {
    message_id: String(raw.message_id ?? raw._id ?? ""),
    _id: mongoId,
    role,
    content: String(raw.content ?? raw.message ?? raw.tool_name ?? ""),
    created_at: String(raw.created_at ?? ""),
    read_at: readAt,
    is_read: readAt ? true : undefined,
  };

  if (role !== "tool") return message;

  return {
    ...message,
    tool_name: String(raw.tool_name ?? raw.content ?? ""),
    request_payload: raw.request_payload,
    response_payload: raw.response_payload,
    request_payload_truncated: Boolean(raw.request_payload_truncated),
    response_payload_truncated: Boolean(raw.response_payload_truncated),
    status: raw.status === "error" ? "error" : "success",
    parent_user_message_id: raw.parent_user_message_id
      ? String(raw.parent_user_message_id)
      : undefined,
  };
}

export async function markChatMessageRead(params: {
  /** Prefer Mongo `_id` from socket/history (sent as API `message_id`). */
  message_id: string;
  agent_id: string;
  chat_session_id: string;
  /** Team member user_id — stored on first read only */
  read_by?: string;
}): Promise<{ ok: boolean; read_at?: string }> {
  if (!params.message_id) return { ok: false };

  try {
    const response = await fastApiAxios.post(
      "/elysium-agents/elysium-atlas/agent/v1/mark-chat-message-read",
      {
        message_id: params.message_id,
        agent_id: params.agent_id,
        chat_session_id: params.chat_session_id,
        ...(params.read_by ? { read_by: params.read_by } : {}),
      },
    );
    const readAt = response.data?.data?.read_at as string | undefined;
    return {
      ok: response.data?.success === true,
      read_at: readAt,
    };
  } catch {
    return { ok: false };
  }
}
