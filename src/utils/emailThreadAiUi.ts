import type {
  EmailAiAction,
  EmailThread,
  EmailThreadMessage,
} from "@/utils/emailAiAgentsApi";

export type ThreadListBadgeTone = "attention" | "success" | "processing";

export interface ThreadListBadge {
  label: string;
  tone: ThreadListBadgeTone;
}

function formatConfidencePercent(confidence?: number): number | null {
  if (typeof confidence !== "number") return null;
  return Math.round(confidence * 100);
}

export function hasDraftReady(aiAction?: EmailAiAction | null): boolean {
  return aiAction?.status === "draft_ready";
}

export function hasAutoSentAction(aiAction?: EmailAiAction | null): boolean {
  return aiAction?.status === "sent" && aiAction.type === "auto_send";
}

export function getThreadListBadge(thread: EmailThread): ThreadListBadge | null {
  if (thread.is_ai_processing) {
    return {
      label: "AI working…",
      tone: "processing",
    };
  }

  const action = thread.ai_action;
  if (!action) return null;

  if (thread.action_required) {
    if (action.type === "draft_fallback") {
      return {
        label: "Auto-send skipped — review draft",
        tone: "attention",
      };
    }
    return {
      label: "Draft ready — review",
      tone: "attention",
    };
  }

  if (hasAutoSentAction(action)) {
    return {
      label: "AI replied",
      tone: "success",
    };
  }

  return null;
}

export function getThreadListBadgeClasses(tone: ThreadListBadgeTone): string {
  switch (tone) {
    case "processing":
      return "bg-sage-green/10 text-sage-green";
    case "success":
      return "bg-teal-green/10 text-teal-green";
    case "attention":
      return "bg-serene-purple/10 text-serene-purple";
  }
}

export function getDraftFallbackBannerText(aiAction: EmailAiAction): string {
  const confidence = formatConfidencePercent(aiAction.confidence);
  const threshold = formatConfidencePercent(aiAction.auto_send_min_confidence);

  if (confidence !== null && threshold !== null) {
    return `Auto-send skipped — confidence below threshold (${confidence}% < ${threshold}%)`;
  }

  return "Auto-send skipped — confidence below threshold";
}

export function getAutoSentBannerText(aiAction: EmailAiAction): string {
  const confidence = formatConfidencePercent(aiAction.confidence);
  if (confidence !== null) {
    return `AI replied automatically (${confidence}% confidence)`;
  }
  return "AI replied automatically";
}

export function getMessageAiHint(
  message: EmailThreadMessage,
  isTriggerMessage: boolean,
): string | null {
  if (message.direction === "outbound" && message.ai_reply?.assisted) {
    if (message.ai_reply.mode === "auto") {
      const confidence = formatConfidencePercent(message.ai_reply.confidence);
      if (confidence !== null) {
        return `Sent using AI (${confidence}% confidence)`;
      }
      return "Sent using AI";
    }
    if (message.ai_reply.mode === "reviewed") {
      return "Drafted by AI, sent by you";
    }
    return "AI-assisted reply";
  }

  if (message.direction === "inbound") {
    if (message.ai_outcome?.type === "auto_sent") {
      return "AI replied automatically to this email";
    }
    if (
      isTriggerMessage ||
      message.ai_outcome?.type === "draft_created"
    ) {
      return "AI drafted a reply to this email";
    }
  }

  return null;
}
