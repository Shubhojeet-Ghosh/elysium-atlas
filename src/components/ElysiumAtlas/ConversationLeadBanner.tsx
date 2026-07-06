"use client";

import type { SessionLeadCollection, SessionLeadListStatus } from "@/types/leadCollection";
import { conversationBannerShellClass } from "@/components/ElysiumAtlas/conversationBannerStyles";
import { getCapturedLeadFields } from "@/utils/leadCollectionSessionUtils";
const DEFAULT_MAX_INLINE_FIELDS = 2;

type ConversationLeadBannerProps = {
  leadCollection: SessionLeadCollection;
  listStatus: Exclude<SessionLeadListStatus, null>;
  onOpenDetails: () => void;
  maxInlineFields?: number;
};

export default function ConversationLeadBanner({
  leadCollection,
  listStatus,
  onOpenDetails,
  maxInlineFields = DEFAULT_MAX_INLINE_FIELDS,
}: ConversationLeadBannerProps) {
  const capturedFields = getCapturedLeadFields(leadCollection);
  const inlineFields = capturedFields.slice(0, maxInlineFields);
  const hasMore = capturedFields.length > inlineFields.length;
  const isComplete = listStatus === "complete";

  return (
    <button
      type="button"
      onClick={onOpenDetails}
      className={`${conversationBannerShellClass} w-full gap-2.5 text-left cursor-pointer transition-colors ${
        isComplete
          ? "bg-serene-purple/10 hover:bg-serene-purple/15 dark:bg-serene-purple/20 dark:hover:bg-serene-purple/25"
          : "bg-teal-green/10 hover:bg-teal-green/15 dark:bg-teal-green/20 dark:hover:bg-teal-green/25"
      }`}
    >
      <span
        className={`text-[10px] font-bold uppercase tracking-wide shrink-0 ${
          isComplete ? "text-serene-purple" : "text-teal-green"
        }`}
      >
        {isComplete ? "Lead collected" : "Partial lead"}
      </span>

      <span className="flex items-center min-w-0 flex-1 overflow-hidden">
        {inlineFields.map((field, index) => (
          <span
            key={field.key}
            className="flex items-center min-w-0 shrink"
          >
            {index > 0 ? (
              <span
                aria-hidden
                className="mx-2 h-3.5 w-px shrink-0 bg-gray-300 dark:bg-gray-600"
              />
            ) : null}
            <span className="text-[12px] font-semibold text-deep-onyx dark:text-pure-mist truncate">
              {field.label}:{" "}
              <span className="font-medium">{field.value}</span>
            </span>
          </span>
        ))}
      </span>

      {hasMore ? (
        <span className="text-[11px] font-semibold text-serene-purple shrink-0 whitespace-nowrap">
          Show more
        </span>
      ) : null}
    </button>
  );
}
