"use client";

import { memo } from "react";
import type { ActiveVisitor } from "@/store/reducers/agentSlice";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDateTime12hr } from "@/utils/formatDate";
import { formatInConversationHandlerLabel } from "@/utils/chatSessionListUtils";
import {
  highlightTruncated,
  truncateMiddle,
  truncateVisitorAt,
} from "@/utils/visitorListDisplayUtils";

interface VisitorTableRowProps {
  visitor: ActiveVisitor;
  userID: string | null;
  isSearchActive: boolean;
  debouncedSearchQuery: string;
  onSelect: (chatSessionId: string) => void;
}

function VisitorTableRow({
  visitor,
  userID,
  isSearchActive,
  debouncedSearchQuery,
  onSelect,
}: VisitorTableRowProps) {
  const displayName = visitor.alias_name || visitor.chat_session_id;
  const matchesName =
    isSearchActive &&
    displayName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
  const trimmedQuery = debouncedSearchQuery.trim();
  const handlerTooltip = formatInConversationHandlerLabel(
    visitor.in_conversation_with,
    visitor.in_conversation_with_name,
    userID ?? "",
  );

  return (
    <TableRow
      onClick={() => onSelect(visitor.chat_session_id)}
      className="cursor-pointer border-b border-gray-100 dark:border-deep-onyx hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20 hover:text-serene-purple dark:hover:text-serene-purple"
    >
      <TableCell className="font-medium py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx dark:text-pure-mist w-[260px] min-w-[320px] max-w-[260px]">
        <span className="flex items-center gap-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="shrink-0 w-[34px] h-[34px] rounded-full overflow-hidden block cursor-pointer shadow-sm">
                {visitor.geo_data?.country_flag ? (
                  <img
                    src={visitor.geo_data.country_flag}
                    alt={visitor.geo_data.country_name ?? ""}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-[11px] font-semibold text-black bg-pure-mist">
                    {visitor.chat_session_id.slice(-2).toUpperCase()}
                  </span>
                )}
              </span>
            </TooltipTrigger>
            {visitor.geo_data?.country_name && (
              <TooltipContent side="top">
                {visitor.geo_data.country_name}
              </TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate max-w-[220px] overflow-hidden text-ellipsis">
                {matchesName
                  ? highlightTruncated(displayName, trimmedQuery)
                  : truncateMiddle(displayName)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">{displayName}</TooltipContent>
          </Tooltip>
        </span>
      </TableCell>

      <TableCell className="min-w-[120px] py-4 px-[10px] text-[14px] whitespace-nowrap">
        {visitor.status === "in-conversation" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-medium text-serene-purple cursor-default">
                in conversation
              </span>
            </TooltipTrigger>
            {handlerTooltip && (
              <TooltipContent side="top">{handlerTooltip}</TooltipContent>
            )}
          </Tooltip>
        )}
        {visitor.status === "online" && (
          <span className="font-medium text-serene-purple">online</span>
        )}
        {visitor.status === "offline" && (
          <span className="font-medium text-serene-purple">offline</span>
        )}
      </TableCell>

      <TableCell className="font-medium py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx dark:text-pure-mist w-[260px] max-w-[260px]">
        {visitor.visitor_at ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block truncate max-w-[220px]">
                {truncateVisitorAt(visitor.visitor_at)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">{visitor.visitor_at}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>

      <TableCell className="min-w-[200px] pl-4 md:pl-8 lg:pl-12 py-4 px-[10px] text-[14px] whitespace-nowrap text-gray-500 dark:text-gray-400">
        {visitor.last_message_at
          ? formatDateTime12hr(visitor.last_message_at)
          : visitor.last_connected_at
            ? formatDateTime12hr(visitor.last_connected_at)
            : "—"}
      </TableCell>
    </TableRow>
  );
}

function areVisitorRowPropsEqual(
  prev: VisitorTableRowProps,
  next: VisitorTableRowProps,
): boolean {
  if (
    prev.userID !== next.userID ||
    prev.isSearchActive !== next.isSearchActive ||
    prev.debouncedSearchQuery !== next.debouncedSearchQuery ||
    prev.onSelect !== next.onSelect
  ) {
    return false;
  }

  const a = prev.visitor;
  const b = next.visitor;

  return (
    a.chat_session_id === b.chat_session_id &&
    a.status === b.status &&
    a.alias_name === b.alias_name &&
    a.visitor_at === b.visitor_at &&
    a.last_message_at === b.last_message_at &&
    a.last_connected_at === b.last_connected_at &&
    a.in_conversation_with === b.in_conversation_with &&
    a.in_conversation_with_name === b.in_conversation_with_name &&
    a.geo_data?.country_flag === b.geo_data?.country_flag &&
    a.geo_data?.country_name === b.geo_data?.country_name
  );
}

export default memo(VisitorTableRow, areVisitorRowPropsEqual);
