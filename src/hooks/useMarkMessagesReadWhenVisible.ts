import { useCallback, useRef } from "react";
import {
  markChatMessageRead,
  resolveMarkReadMessageId,
} from "@/utils/conversationMessageUtils";

type UseMarkMessagesReadWhenVisibleOptions = {
  enabled: boolean;
  agent_id: string;
  chat_session_id: string;
  /** Team member user_id for agent-side read receipts */
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
      if (!enabled || !agent_id || !chat_session_id) return;

      const apiMessageId = resolveMarkReadMessageId({
        _id: mongoId ?? undefined,
        message_id: messageId,
      });
      if (!apiMessageId) return;

      if (doneRef.current.has(apiMessageId) || inFlightRef.current.has(apiMessageId)) {
        return;
      }

      inFlightRef.current.add(apiMessageId);

      const { ok, read_at: readAtFromApi } = await markChatMessageRead({
        message_id: apiMessageId,
        agent_id,
        chat_session_id,
        read_by,
      });

      inFlightRef.current.delete(apiMessageId);

      if (ok) {
        doneRef.current.add(apiMessageId);
        onMessageMarkedRef.current(
          messageId,
          readAtFromApi ?? new Date().toISOString(),
          mongoId ?? apiMessageId,
        );
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
