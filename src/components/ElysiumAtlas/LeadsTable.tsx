"use client";

import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Spinner from "@/components/ui/Spinner";
import TablePaginationControls from "@/components/ElysiumAtlas/TablePaginationControls";
import { formatDateTime12hr } from "@/utils/formatDate";
import { truncateMiddle } from "@/utils/visitorListDisplayUtils";
import type { LeadFieldKey, TeamLeadListItem } from "@/types/leadCollection";
import { type VisitorPageSize } from "@/lib/config";
import { cn } from "@/lib/utils";

const LEAD_FIELD_COLUMNS: {
  key: LeadFieldKey;
  label: string;
  minWidth: number;
  maxWidth: number;
}[] = [
  { key: "email", label: "Email", minWidth: 160, maxWidth: 220 },
  { key: "name", label: "Name", minWidth: 120, maxWidth: 160 },
  { key: "phone", label: "Phone", minWidth: 120, maxWidth: 150 },
  { key: "company", label: "Company", minWidth: 140, maxWidth: 180 },
  { key: "interest", label: "Interest", minWidth: 120, maxWidth: 160 },
];

const FROZEN_SESSION_WIDTH = 180;
const FROZEN_AGENT_WIDTH = 160;
const LAST_UPDATED_WIDTH = { minWidth: 150, maxWidth: 170 };

const COLUMN_COUNT = 3 + LEAD_FIELD_COLUMNS.length;

const CELL_SURFACE_CLASS =
  "bg-white dark:bg-black group-hover/lead-row:bg-[#f7f5f9] dark:group-hover/lead-row:bg-[#15121c]";

const HEAD_SURFACE_CLASS = "bg-white dark:bg-black";

const ROW_HOVER_CLASS =
  "group/lead-row cursor-pointer border-b border-gray-100 dark:border-deep-onyx transition-colors duration-200 hover:text-serene-purple dark:hover:text-serene-purple";

const STICKY_SESSION_BODY_CLASS = cn(
  CELL_SURFACE_CLASS,
  "md:sticky md:left-0 md:z-[5]",
);

const STICKY_AGENT_BODY_CLASS = cn(
  CELL_SURFACE_CLASS,
  "md:sticky md:left-[180px] md:z-[6]",
  "md:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)] md:dark:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.45)]",
);

const STICKY_SESSION_HEAD_CLASS = cn(
  HEAD_SURFACE_CLASS,
  "md:sticky md:left-0 md:z-[15]",
);

const STICKY_AGENT_HEAD_CLASS = cn(
  HEAD_SURFACE_CLASS,
  "md:sticky md:left-[180px] md:z-[16]",
  "md:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)] md:dark:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.45)]",
);

interface LeadsTableProps {
  leads: TeamLeadListItem[];
  agentNameById: Record<string, string>;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  pageSize: VisitorPageSize;
  pageSizeOptions?: readonly number[];
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: VisitorPageSize) => void;
  onLeadClick: (lead: TeamLeadListItem) => void;
}

function columnWidthStyle(minWidth: number, maxWidth: number) {
  return {
    minWidth: `${minWidth}px`,
    maxWidth: `${maxWidth}px`,
    width: `${maxWidth}px`,
  } as const;
}

function EllipsisText({
  value,
  className,
  mono = false,
  useMiddleTruncate = false,
}: {
  value: string;
  className?: string;
  mono?: boolean;
  useMiddleTruncate?: boolean;
}) {
  const display = useMiddleTruncate ? truncateMiddle(value) : value;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "block w-full truncate",
            mono && "font-mono text-[12px]",
            className,
          )}
        >
          {display}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{value}</TooltipContent>
    </Tooltip>
  );
}

function DataCell({
  minWidth,
  maxWidth,
  className,
  stickyVariant,
  children,
}: {
  minWidth: number;
  maxWidth: number;
  className?: string;
  stickyVariant?: "session" | "agent";
  children: React.ReactNode;
}) {
  return (
    <td
      className={cn(
        "py-4 px-[10px] text-[14px] align-middle overflow-hidden",
        stickyVariant === "session" && STICKY_SESSION_BODY_CLASS,
        stickyVariant === "agent" && STICKY_AGENT_BODY_CLASS,
        stickyVariant === undefined && CELL_SURFACE_CLASS,
        className,
      )}
      style={columnWidthStyle(minWidth, maxWidth)}
    >
      {children}
    </td>
  );
}

function HeaderCell({
  label,
  minWidth,
  maxWidth,
  stickyVariant,
}: {
  label: string;
  minWidth: number;
  maxWidth: number;
  stickyVariant?: "session" | "agent";
}) {
  return (
    <th
      className={cn(
        "py-3 px-[10px] text-[14px] font-semibold text-left align-middle whitespace-nowrap overflow-hidden",
        stickyVariant === "session" && STICKY_SESSION_HEAD_CLASS,
        stickyVariant === "agent" && STICKY_AGENT_HEAD_CLASS,
        stickyVariant === undefined && HEAD_SURFACE_CLASS,
      )}
      style={columnWidthStyle(minWidth, maxWidth)}
    >
      <span className="block truncate">{label}</span>
    </th>
  );
}

function FieldCell({
  value,
  minWidth,
  maxWidth,
}: {
  value: string | undefined;
  minWidth: number;
  maxWidth: number;
}) {
  const trimmed = value?.trim();

  return (
    <DataCell
      minWidth={minWidth}
      maxWidth={maxWidth}
      className={trimmed ? "text-deep-onyx dark:text-pure-mist" : "text-gray-400"}
    >
      {trimmed ? (
        <EllipsisText value={trimmed} />
      ) : (
        <span className="block truncate">—</span>
      )}
    </DataCell>
  );
}

function getSessionColumnDisplay(lead: TeamLeadListItem) {
  const alias = lead.alias_name?.trim();
  if (alias) {
    return {
      display: alias,
      tooltip: `${alias} | ${lead.chat_session_id}`,
      mono: false,
      useMiddleTruncate: false,
      className: "text-deep-onyx dark:text-pure-mist",
    };
  }

  return {
    display: lead.chat_session_id,
    tooltip: lead.chat_session_id,
    mono: true,
    useMiddleTruncate: true,
    className: "text-gray-500 dark:text-gray-400",
  };
}

function LeadTableRow({
  lead,
  agentName,
  onLeadClick,
}: {
  lead: TeamLeadListItem;
  agentName: string;
  onLeadClick: (lead: TeamLeadListItem) => void;
}) {
  const sessionColumn = getSessionColumnDisplay(lead);

  return (
    <tr
      onClick={() => onLeadClick(lead)}
      className={ROW_HOVER_CLASS}
    >
      <DataCell
        minWidth={FROZEN_SESSION_WIDTH}
        maxWidth={FROZEN_SESSION_WIDTH}
        stickyVariant="session"
        className={sessionColumn.className}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "block w-full truncate",
                sessionColumn.mono && "font-mono text-[12px]",
              )}
            >
              {sessionColumn.useMiddleTruncate
                ? truncateMiddle(sessionColumn.display)
                : sessionColumn.display}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-none whitespace-nowrap text-left [text-wrap:nowrap]"
          >
            {sessionColumn.tooltip}
          </TooltipContent>
        </Tooltip>
      </DataCell>

      <DataCell
        minWidth={FROZEN_AGENT_WIDTH}
        maxWidth={FROZEN_AGENT_WIDTH}
        stickyVariant="agent"
        className="text-deep-onyx dark:text-pure-mist"
      >
        <EllipsisText value={agentName} />
      </DataCell>

      <DataCell
        minWidth={LAST_UPDATED_WIDTH.minWidth}
        maxWidth={LAST_UPDATED_WIDTH.maxWidth}
        className="text-deep-onyx dark:text-pure-mist whitespace-nowrap"
      >
        <span className="block truncate">
          {lead.updated_at ? formatDateTime12hr(lead.updated_at) : "—"}
        </span>
      </DataCell>

      {LEAD_FIELD_COLUMNS.map(({ key, minWidth, maxWidth }) => (
        <FieldCell
          key={key}
          value={lead.fields[key]}
          minWidth={minWidth}
          maxWidth={maxWidth}
        />
      ))}
    </tr>
  );
}

export default function LeadsTable({
  leads,
  agentNameById,
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  total,
  pageSize,
  pageSizeOptions,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onLeadClick,
}: LeadsTableProps) {
  const [showRightGradient, setShowRightGradient] = useState(false);
  const [isTableHovered, setIsTableHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowRightGradient(scrollLeft + clientWidth < scrollWidth - 5);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    const observer = new ResizeObserver(handleScroll);
    observer.observe(container);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      observer.disconnect();
    };
  }, [leads.length]);

  const tableMinWidth =
    FROZEN_SESSION_WIDTH +
    FROZEN_AGENT_WIDTH +
    LAST_UPDATED_WIDTH.maxWidth +
    LEAD_FIELD_COLUMNS.reduce((sum, col) => sum + col.maxWidth, 0);

  return (
    <div className="w-full mt-[12px] overflow-hidden">
      <div
        className={cn(
          "relative leads-table-scroll-wrap",
          isTableHovered && "is-active",
        )}
        onMouseEnter={() => setIsTableHovered(true)}
        onMouseLeave={() => setIsTableHovered(false)}
      >
        <div
          ref={scrollContainerRef}
          className="leads-table-scroll overflow-x-auto overscroll-x-contain isolate"
        >
          <table
            className="w-full caption-bottom text-sm border-separate border-spacing-0"
            style={{ minWidth: `${tableMinWidth}px` }}
          >
            <thead className="[&_tr]:border-b">
              <tr className="group/lead-row">
                <HeaderCell
                  label="Session"
                  minWidth={FROZEN_SESSION_WIDTH}
                  maxWidth={FROZEN_SESSION_WIDTH}
                  stickyVariant="session"
                />
                <HeaderCell
                  label="Agent"
                  minWidth={FROZEN_AGENT_WIDTH}
                  maxWidth={FROZEN_AGENT_WIDTH}
                  stickyVariant="agent"
                />
                <HeaderCell
                  label="Last Updated"
                  minWidth={LAST_UPDATED_WIDTH.minWidth}
                  maxWidth={LAST_UPDATED_WIDTH.maxWidth}
                />
                {LEAD_FIELD_COLUMNS.map(({ key, label, minWidth, maxWidth }) => (
                  <HeaderCell
                    key={key}
                    label={label}
                    minWidth={minWidth}
                    maxWidth={maxWidth}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading && leads.length === 0 ? (
                <tr className="hover:bg-transparent">
                  <td colSpan={COLUMN_COUNT} className="py-10 text-center">
                    <Spinner className="border-serene-purple dark:border-pure-mist mx-auto" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr className="hover:bg-transparent">
                  <td
                    colSpan={COLUMN_COUNT}
                    className="py-10 text-center text-[14px] text-gray-500 dark:text-gray-400"
                  >
                    No leads captured yet.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <LeadTableRow
                    key={lead.lead_id}
                    lead={lead}
                    agentName={
                      agentNameById[lead.agent_id] ?? lead.agent_id
                    }
                    onLeadClick={onLeadClick}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {showRightGradient && leads.length > 0 && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10" />
        )}
      </div>

      <TablePaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrev={hasPrev}
        total={total}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        isLoading={isLoading}
        recordLabel="lead"
        recordLabelPlural="leads"
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        className="mt-3 mb-0"
      />
    </div>
  );
}
