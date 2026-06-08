"use client";

import { Reply } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EmailAiAction } from "@/utils/emailAiAgentsApi";
import {
  getAutoSentBannerText,
  getDraftFallbackBannerText,
  hasAutoSentAction,
} from "@/utils/emailThreadAiUi";

function parseEmailAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2] };
  }
  return { name: raw, email: raw };
}

function formatRecipientLine(recipients: string[] | undefined): string {
  if (!recipients?.length) return "";
  return recipients
    .map((entry) => {
      const { name, email } = parseEmailAddress(entry);
      if (name && email && name !== email) {
        return `${name} (${email})`;
      }
      return email || name;
    })
    .join(", ");
}

interface EmailThreadDraftPanelProps {
  aiAction: EmailAiAction;
  isSending: boolean;
  onSend: () => void;
}

export default function EmailThreadDraftPanel({
  aiAction,
  isSending,
  onSend,
}: EmailThreadDraftPanelProps) {
  const isAutoSent = hasAutoSentAction(aiAction);
  const isDraftFallback =
    aiAction.status === "draft_ready" && aiAction.type === "draft_fallback";
  const toLine = formatRecipientLine(aiAction.recipients?.to);
  const ccLine = formatRecipientLine(aiAction.recipients?.cc);
  const bccLine = formatRecipientLine(aiAction.recipients?.bcc);
  const bodyText = aiAction.body_text?.trim() || "";
  const confidence =
    typeof aiAction.confidence === "number"
      ? Math.round(aiAction.confidence * 100)
      : null;
  const threshold =
    typeof aiAction.auto_send_min_confidence === "number"
      ? Math.round(aiAction.auto_send_min_confidence * 100)
      : null;

  const bannerText = isAutoSent
    ? getAutoSentBannerText(aiAction)
    : isDraftFallback
      ? getDraftFallbackBannerText(aiAction)
      : null;

  return (
    <div className="mx-2 mb-4 mt-2 rounded-xl border border-gray-200 bg-white shadow-sm">
      {bannerText && (
        <div
          className={`border-b px-4 py-2.5 text-[12px] font-medium ${
            isAutoSent
              ? "border-teal-green/20 bg-teal-green/10 text-teal-green"
              : "border-serene-purple/20 bg-serene-purple/10 text-serene-purple"
          }`}
        >
          {bannerText}
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
        <Reply size={16} className="shrink-0 text-gray-500" />
        <div className="min-w-0 flex-1 text-[13px] text-gray-700">
          {toLine ? (
            <span className="truncate">{toLine}</span>
          ) : (
            <span className="text-gray-400">No recipients</span>
          )}
        </div>
        {confidence !== null && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                role="img"
                aria-label={`${confidence}% confidence`}
                className="inline-flex shrink-0 items-center"
              >
                <img
                  src="/stars.svg"
                  alt=""
                  aria-hidden
                  className="h-3.5 w-3.5 shrink-0 opacity-80"
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              {threshold !== null && isDraftFallback
                ? `${confidence}% confidence (threshold ${threshold}%)`
                : `${confidence}% confidence — AI-generated reply`}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {(ccLine || bccLine || aiAction.subject) && (
        <div className="space-y-1 border-b border-gray-100 px-4 py-2 text-[12px] text-gray-500">
          {aiAction.subject && (
            <div>
              <span className="font-medium text-gray-600">Subject: </span>
              {aiAction.subject}
            </div>
          )}
          {ccLine && (
            <div>
              <span className="font-medium text-gray-600">Cc: </span>
              {ccLine}
            </div>
          )}
          {bccLine && (
            <div>
              <span className="font-medium text-gray-600">Bcc: </span>
              {bccLine}
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-4 text-[14px] leading-relaxed text-gray-900 whitespace-pre-wrap">
        {bodyText ||
          (isAutoSent
            ? "Reply content is not available yet. Sync may still be in progress."
            : "Draft content is not available. Open Gmail to review the draft.")}
      </div>

      {!isAutoSent && (
        <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-3">
          <PrimaryButton
            type="button"
            onClick={onSend}
            disabled={isSending}
            className="min-h-[40px] min-w-[88px] font-[600] text-[13px]"
          >
            {isSending ? <Spinner className="border-white" /> : "Send"}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
