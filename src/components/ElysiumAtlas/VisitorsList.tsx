"use client";
import { useState, useEffect, useRef } from "react";
import { type VisitorPageSize } from "@/lib/config";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomInput from "@/components/inputs/CustomInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import { formatDateTime12hr } from "@/utils/formatDate";
import { captureChatSession, formatInConversationHandlerLabel } from "@/utils/chatSessionListUtils";
import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isKbSearchInProgress } from "@/utils/kbSearchUi";
import KbSearchingTableRow from "./kb/KbSearchingTableRow";
import Spinner from "@/components/ui/Spinner";
import LiveVisitorsRefetchButton from "./LiveVisitorsRefetchButton";

interface VisitorsListProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  searchQuery: string;
  debouncedSearchQuery: string;
  isSearchActive: boolean;
  isLoadingSessions: boolean;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: VisitorPageSize) => void;
}

export default function VisitorsList({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  total,
  pageSize,
  pageSizeOptions,
  searchQuery,
  debouncedSearchQuery,
  isSearchActive,
  isLoadingSessions,
  onSearchChange,
  onRefresh,
  onPageChange,
  onPageSizeChange,
}: VisitorsListProps) {
  const activeVisitors = useAppSelector((state) => state.agent.active_visitors);
  const agentID = useAppSelector((state) => state.agent.agentID);
  const userID = useAppSelector((state) => state.userProfile.userID);
  const teamRole = useActiveTeamRole();
  const dispatch = useAppDispatch();

  const [pageInput, setPageInput] = useState("1");
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isSearching = isKbSearchInProgress(
    searchQuery,
    debouncedSearchQuery,
    isLoadingSessions,
  );
  const displayVisitors = isSearching ? [] : activeVisitors;

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const truncateMiddle = (s?: string) => {
    if (!s) return "";
    const start = 6;
    const end = 4;
    if (s.length <= start + end) return s;
    return `${s.slice(0, start)}.....${s.slice(-end)}`;
  };

  const truncateVisitorAt = (s?: string) => {
    if (!s) return "";
    const end = 20;
    if (s.length <= end) return s;
    return `...${s.slice(-end)}`;
  };

  const highlightTruncated = (full: string, term: string) => {
    const t = truncateMiddle(full);
    if (!term.trim()) return t;
    const lower = t.toLowerCase();
    const lowerTerm = term.toLowerCase();
    const idx = lower.indexOf(lowerTerm);
    if (idx === -1) return t;
    return (
      <>
        {t.substring(0, idx)}
        <span className="bg-serene-purple/80 text-white font-semibold">
          {t.substring(idx, idx + term.length)}
        </span>
        {t.substring(idx + term.length)}
      </>
    );
  };

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
    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [displayVisitors]);

  const handleVisitorClick = (chat_session_id: string) => {
    const visitor = activeVisitors.find(
      (v) => v.chat_session_id === chat_session_id,
    );
    if (!agentID || !userID) return;

    captureChatSession(dispatch, {
      agent_id: agentID,
      user_id: userID,
      chat_session_id,
      in_conversation_with: visitor?.in_conversation_with,
      in_conversation_with_name: visitor?.in_conversation_with_name,
      team_role: teamRole,
    });
  };

  const handlePreviousPage = () => {
    if (hasPrev) onPageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    if (hasNext) onPageChange(currentPage + 1);
  };

  const handlePageClick = (page: number) => onPageChange(page);

  const handleFirstPage = () => {
    if (currentPage > 1) onPageChange(1);
  };

  const handleLastPage = () => {
    const lastPage = Math.max(1, totalPages);
    if (currentPage < lastPage) onPageChange(lastPage);
  };

  const commitPageJump = () => {
    const parsed = parseInt(pageInput, 10);
    if (Number.isNaN(parsed)) {
      setPageInput(String(currentPage));
      return;
    }
    const target = Math.min(Math.max(1, totalPages), Math.max(1, parsed));
    setPageInput(String(target));
    if (target !== currentPage) onPageChange(target);
  };

  const paginationBtnClass =
    "p-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors";

  const effectiveTotalPages = Math.max(1, totalPages);
  const paginationDisabled = total === 0 && !isSearching;

  const emptyMessage = isSearchActive
    ? `No chat sessions found matching "${debouncedSearchQuery.trim()}"`
    : "No chat sessions yet.";

  const paginationControls = (
    <div className="flex flex-row flex-wrap items-center justify-end gap-2 mt-3">
      <div className="flex items-center justify-end gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={handleFirstPage}
          disabled={paginationDisabled || currentPage <= 1}
          className={paginationBtnClass}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={handlePreviousPage}
          disabled={paginationDisabled || !hasPrev}
          className={paginationBtnClass}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: effectiveTotalPages }, (_, i) => i + 1).map(
            (page) => {
              if (
                page === 1 ||
                page === effectiveTotalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    type="button"
                    key={page}
                    onClick={() => handlePageClick(page)}
                    disabled={paginationDisabled}
                    className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                      paginationDisabled
                        ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                        : "cursor-pointer"
                    } ${
                      !paginationDisabled && currentPage === page
                        ? "bg-serene-purple text-white border-serene-purple"
                        : !paginationDisabled
                          ? "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          : ""
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span
                    key={page}
                    className="px-1 text-[11px] text-gray-400 dark:text-gray-500"
                  >
                    ...
                  </span>
                );
              }
              return null;
            },
          )}
        </div>

        <button
          type="button"
          onClick={handleNextPage}
          disabled={paginationDisabled || !hasNext}
          className={paginationBtnClass}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={handleLastPage}
          disabled={paginationDisabled || currentPage >= effectiveTotalPages}
          className={paginationBtnClass}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 text-[12px] text-gray-500 dark:text-gray-400 ml-1">
          <span className="whitespace-nowrap hidden sm:inline">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              onPageSizeChange(Number(value) as VisitorPageSize)
            }
          >
            <SelectTrigger
              aria-label="Rows per page"
              className="h-9 w-[72px] border-[2px] border-gray-300 dark:border-deep-onyx rounded-[10px] bg-white dark:bg-deep-onyx text-[13px] font-[600] text-deep-onyx dark:text-pure-mist shadow-none focus-visible:border-serene-purple focus-visible:ring-serene-purple/30 px-2"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 text-[12px] text-gray-500 dark:text-gray-400">
          <span className="whitespace-nowrap hidden sm:inline">Go to</span>
          <CustomInput
            type="number"
            min={1}
            max={effectiveTotalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitPageJump();
              }
            }}
            onBlur={commitPageJump}
            disabled={paginationDisabled}
            aria-label="Page number"
            className="w-[44px] sm:w-[52px] h-9 text-center text-[13px] py-2 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="whitespace-nowrap sm:hidden">/{effectiveTotalPages}</span>
          <span className="whitespace-nowrap hidden sm:inline">
            of {effectiveTotalPages}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full mt-[12px] overflow-hidden">
      <div className="flex items-center justify-end gap-2 mb-4 px-0">
        <LiveVisitorsRefetchButton
          className="shrink-0"
          disabled={!agentID}
          isLoading={isLoadingSessions && !isSearching}
          onRefresh={onRefresh}
        />
        <div className="relative w-full max-w-[220px] lg:max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <CustomInput
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            maxLength={200}
            className="w-full pl-9 pr-3 py-2 text-[13px] h-9"
          />
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto md:overflow-visible"
        >
          <div className="inline-block min-w-full align-middle">
            <Table className="min-w-[400px] lg:min-w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[260px] max-w-[260px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                    Visitor
                  </TableHead>
                  <TableHead className="min-w-[120px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                    Status
                  </TableHead>
                  <TableHead className="w-[260px] max-w-[260px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                    Visitor At
                  </TableHead>
                  <TableHead className="min-w-[200px] pl-4 md:pl-8 lg:pl-12 font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                    Last Active
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSearching ? (
                  <KbSearchingTableRow
                    colSpan={4}
                    query={searchQuery.trim()}
                  />
                ) : isLoadingSessions ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="py-10 text-center">
                      <Spinner className="border-serene-purple dark:border-pure-mist mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : displayVisitors.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-[14px] text-gray-500 dark:text-gray-400"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayVisitors.map((visitor) => {
                    const displayName =
                      visitor.alias_name || visitor.chat_session_id;
                    const matchesName =
                      isSearchActive &&
                      displayName
                        ?.toLowerCase()
                        .includes(debouncedSearchQuery.toLowerCase());

                    return (
                      <TableRow
                        key={visitor.chat_session_id}
                        onClick={() =>
                          handleVisitorClick(visitor.chat_session_id)
                        }
                        className="cursor-pointer border-b border-gray-100 dark:border-deep-onyx transition-all duration-200 hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20 hover:text-serene-purple dark:hover:text-serene-purple"
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
                                    />
                                  ) : (
                                    <span className="w-full h-full flex items-center justify-center text-[11px] font-semibold text-black bg-pure-mist">
                                      {visitor.chat_session_id
                                        .slice(-2)
                                        .toUpperCase()}
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
                                    ? highlightTruncated(
                                        displayName,
                                        debouncedSearchQuery.trim(),
                                      )
                                    : truncateMiddle(displayName)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {displayName}
                              </TooltipContent>
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
                              <TooltipContent side="top">
                                {formatInConversationHandlerLabel(
                                  visitor.in_conversation_with,
                                  visitor.in_conversation_with_name,
                                  userID,
                                )}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {visitor.status === "online" && (
                            <span className="font-medium text-serene-purple">
                              online
                            </span>
                          )}
                          {visitor.status === "offline" && (
                            <span className="font-medium text-serene-purple">
                              offline
                            </span>
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
                              <TooltipContent side="top">
                                {visitor.visitor_at}
                              </TooltipContent>
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
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {showRightGradient && displayVisitors.length > 0 && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
        )}
      </div>

      {paginationControls}
    </div>
  );
}
