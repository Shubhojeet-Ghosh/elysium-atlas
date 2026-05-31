import { useCallback, useRef } from "react";
import { markChatMessageRead } from "@/utils/conversationMessageUtils";

type UseMarkMessagesReadWhenVisibleOptions = {
  enabled: boolean;
  agent_id: string;
  chat_session_id: string;
  /** MongoDB user id — agent-side read receipts only */
  read_by?: string;
  onMessageMarked: (
    messageId: string,
    readAt: string,
    mongoId?: string | null,
  ) => void;
};

export function useMarkMessagesReadWhenVisible({
  enabled,
  agent_id,
  chat_session_id,
  read_by,
  onMessageMarked,
}: UseMarkMessagesReadWhenVisibleOptions) {
  const inFlightRef = useRef(new Set<string>());
  const doneRef = useRef(new Set<string>());
  const onMessageMarkedRef = useRef(onMessageMarked);
  onMessageMarkedRef.current = onMessageMarked;

  const markVisible = useCallback(
    async (messageId: string, mongoId?: string | null) => {
      if (!enabled || !messageId || !agent_id || !chat_session_id) return;

      const dedupeKey = mongoId ?? messageId;
      if (
        doneRef.current.has(dedupeKey) ||
        inFlightRef.current.has(dedupeKey)
      ) {
        return;
      }

      inFlightRef.current.add(dedupeKey);

      const readAt = new Date().toISOString();
      const ok = await markChatMessageRead({
        message_id: messageId,
        _id: mongoId ?? null,
        agent_id,
        chat_session_id,
        read_by,
      });

      inFlightRef.current.delete(dedupeKey);

      if (ok) {
        doneRef.current.add(dedupeKey);
        onMessageMarkedRef.current(messageId, readAt, mongoId ?? null);
      }
    },
    [enabled, agent_id, chat_session_id, read_by],
  );

  const reset = useCallback(() => {
    inFlightRef.current.clear();
    doneRef.current.clear();
  }, []);

  return { markVisible, reset };
}
