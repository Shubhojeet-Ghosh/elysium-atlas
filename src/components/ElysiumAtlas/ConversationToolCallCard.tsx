"use client";

import { memo, useState } from "react";
import { ChevronRight, Cog } from "lucide-react";
import type { ConversationMessage } from "@/store/reducers/agentSlice";
import { formatChatTimestamp } from "@/utils/formatDate";
import { cn } from "@/lib/utils";

function formatSystemActivityName(name: string): string {
  const spaced = name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  if (!spaced) return "System activity";
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatToolPayload(payload: unknown): string {
  if (payload == null) return "—";
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function ToolPayloadBlock({
  label,
  payload,
  truncated,
}: {
  label: string;
  payload: unknown;
  truncated: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </span>
        {truncated ? (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            Partial
          </span>
        ) : null}
      </div>
      <pre className="max-h-40 overflow-auto rounded-lg bg-gray-50 px-2.5 py-2 font-mono text-[11px] leading-relaxed text-gray-700 dark:bg-black/40 dark:text-pure-mist custom-scrollbar whitespace-pre-wrap break-all">
        {formatToolPayload(payload)}
      </pre>
    </div>
  );
}

function ConversationToolCallCard({
  message,
  isFirstInGroup = false,
  isLastInGroup = false,
}: {
  message: ConversationMessage;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isError = message.status === "error";
  const activityName = formatSystemActivityName(
    message.tool_name || message.content || "system activity",
  );
  const showTruncatedBadge =
    Boolean(message.request_payload_truncated) ||
    Boolean(message.response_payload_truncated);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5",
        isFirstInGroup ? "mt-2" : "mt-0",
        isLastInGroup ? "mb-3" : "mb-0",
      )}
    >
      <div className="flex w-full items-center gap-2 px-1">
        <div className="h-px flex-1 bg-gray-200 dark:bg-pure-mist/15" />
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "inline-flex max-w-[88%] items-center gap-1.5 rounded-full px-2.5 py-1 text-left cursor-pointer transition-colors",
            isError
              ? "bg-red-50 hover:bg-red-100/80 dark:bg-red-950/40 dark:hover:bg-red-950/55"
              : "bg-serene-purple/8 hover:bg-serene-purple/14 dark:bg-serene-purple/20 dark:hover:bg-serene-purple/28",
          )}
          aria-expanded={open}
        >
          <Cog
            className={cn(
              "h-3 w-3 shrink-0",
              isError
                ? "text-red-500"
                : "text-serene-purple dark:text-pure-mist",
            )}
          />
          <span className="min-w-0 truncate text-[11px] font-medium text-gray-700 dark:text-pure-mist">
            {activityName}
          </span>
          {isError ? (
            <span className="shrink-0 text-[10px] font-semibold text-red-600 dark:text-red-400">
              Failed
            </span>
          ) : null}
          <ChevronRight
            className={cn(
              "h-3 w-3 shrink-0 text-gray-400 transition-transform",
              open && "rotate-90",
            )}
          />
        </button>
        <div className="h-px flex-1 bg-gray-200 dark:bg-pure-mist/15" />
      </div>

      {open ? (
        <div
          className={cn(
            "w-full rounded-xl border px-3 py-2.5 space-y-2.5",
            isError
              ? "border-red-200 bg-white dark:border-red-500/30 dark:bg-deep-onyx"
              : "border-serene-purple/15 bg-white dark:border-pure-mist/15 dark:bg-deep-onyx",
          )}
        >
          {showTruncatedBadge ? (
            <span className="inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
              Partial data
            </span>
          ) : null}
          <ToolPayloadBlock
            label="Input"
            payload={message.request_payload}
            truncated={Boolean(message.request_payload_truncated)}
          />
          <ToolPayloadBlock
            label="Result"
            payload={message.response_payload}
            truncated={Boolean(message.response_payload_truncated)}
          />
          <span className="block text-[10px] text-gray-400 dark:text-gray-500">
            {formatChatTimestamp(message.created_at)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default memo(ConversationToolCallCard);
