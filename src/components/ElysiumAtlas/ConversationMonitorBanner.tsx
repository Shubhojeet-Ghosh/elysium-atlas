"use client";

import { formatPeerTakeoverBannerMessage } from "@/utils/chatSessionListUtils";
import { conversationBannerShellClass } from "@/components/ElysiumAtlas/conversationBannerStyles";

type ConversationMonitorBannerProps = {
  variant?: "self" | "peer";
  handlerName?: string | null;
  onJoinAssist?: () => void;
  onTakeOver: () => void;
  isTakeoverPending?: boolean;
  canTakeOver?: boolean;
};

const bannerClassName = `${conversationBannerShellClass} w-full bg-serene-purple/10 dark:bg-serene-purple/20`;

const messageClassName =
  "text-[12px] font-semibold text-deep-onyx dark:text-pure-mist truncate";

const joinAssistClassName =
  "min-h-10 px-3.5 py-2 text-[11px] font-semibold rounded-md border border-serene-purple/60 bg-white/95 text-serene-purple shadow-sm dark:bg-deep-onyx/80 dark:border-pure-mist/30 dark:text-pure-mist cursor-not-allowed opacity-70";

const takeOverClassName =
  "min-h-10 px-3.5 py-2 text-[11px] font-semibold rounded-md bg-serene-purple text-pure-mist shadow-sm hover:bg-serene-purple/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors";

export default function ConversationMonitorBanner({
  variant = "self",
  handlerName,
  onJoinAssist,
  onTakeOver,
  isTakeoverPending = false,
  canTakeOver = true,
}: ConversationMonitorBannerProps) {
  if (variant === "peer") {
    return (
      <div className={`${bannerClassName} items-center`}>
        <span className={messageClassName}>
          {formatPeerTakeoverBannerMessage(handlerName)}
        </span>
      </div>
    );
  }

  return (
    <div className={`${bannerClassName} items-center justify-between gap-2`}>
      <span className={messageClassName}>
        You are monitoring this conversation
      </span>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onJoinAssist}
          disabled
          title="Coming soon"
          className={joinAssistClassName}
        >
          Join &amp; Assist
        </button>
        <button
          type="button"
          onClick={onTakeOver}
          disabled={!canTakeOver || isTakeoverPending}
          title={
            canTakeOver
              ? undefined
              : "Another team member is already handling this chat"
          }
          className={takeOverClassName}
        >
          {isTakeoverPending ? "Taking over…" : "Take Over"}
        </button>
      </div>
    </div>
  );
}
