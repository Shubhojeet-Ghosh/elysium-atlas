export interface LlmContextConfig {
  max_chat_history_messages: number;
}

export const DEFAULT_LLM_CONTEXT_CONFIG: LlmContextConfig = {
  max_chat_history_messages: 10,
};

export const MIN_CHAT_HISTORY_MESSAGES = 1;
export const MAX_CHAT_HISTORY_MESSAGES = 100;

export function clampChatHistoryMessages(value: number) {
  return Math.min(
    MAX_CHAT_HISTORY_MESSAGES,
    Math.max(MIN_CHAT_HISTORY_MESSAGES, Math.trunc(value)),
  );
}

export function normalizeLlmContextConfig(
  config?: Partial<LlmContextConfig> | null,
): LlmContextConfig {
  const raw = config?.max_chat_history_messages;
  const parsed =
    typeof raw === "number" && Number.isFinite(raw)
      ? raw
      : DEFAULT_LLM_CONTEXT_CONFIG.max_chat_history_messages;

  return {
    max_chat_history_messages: clampChatHistoryMessages(parsed),
  };
}
