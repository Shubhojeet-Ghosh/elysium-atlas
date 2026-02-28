"use client";
import { useState, useMemo, useEffect, useRef } from "react";

interface VisitorsListProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  onPageChange: (page: number) => void;
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomInput from "@/components/inputs/CustomInput";
import { ChevronLeft, ChevronRight, Search, Radio } from "lucide-react";
import { useAppSelector } from "@/store";
import { formatDateTime12hr } from "@/utils/formatDate";
import Badge from "@/components/ui/Badge";

export default function VisitorsList({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  total,
  onPageChange,
}: VisitorsListProps) {
  const activeVisitors = useAppSelector((state) => state.agent.active_visitors);

  const [searchTerm, setSearchTerm] = useState("");
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter by session ID or alias name
  const filteredVisitors = useMemo(() => {
    if (!searchTerm.trim()) return activeVisitors;
    const lower = searchTerm.toLowerCase();
    return activeVisitors.filter(
      (v) =>
        v.chat_session_id?.toLowerCase().includes(lower) ||
        v.alias_name?.toLowerCase().includes(lower),
    );
  }, [activeVisitors, searchTerm]);

  // currentVisitors is the full filtered set — server already returns one page
  const currentVisitors = filteredVisitors;

  // Horizontal scroll gradient
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
  }, [currentVisitors]);

  // Highlight matching text
  const highlightMatch = (text: string, term: string) => {
    if (!term.trim()) return text;
    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    const idx = lowerText.indexOf(lowerTerm);
    if (idx === -1) return text;
    return (
      <>
        {text.substring(0, idx)}
        <span className="bg-serene-purple/80 text-white font-semibold">
          {text.substring(idx, idx + term.length)}
        </span>
        {text.substring(idx + term.length)}
      </>
    );
  };

  const handlePreviousPage = () => {
    if (hasPrev) onPageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    if (hasNext) onPageChange(currentPage + 1);
  };

  const handlePageClick = (page: number) => onPageChange(page);

  if (activeVisitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500 gap-3">
        <Radio className="w-10 h-10 opacity-40" />
        <p className="text-[13px]">No visitors are currently online</p>
      </div>
    );
  }

  return (
    <div className="w-full mt-[12px] overflow-hidden">
      {/* Header + Search */}
      <div className="flex items-center justify-between mb-4 px-0">
        <div className="lg:text-[16px] text-[14px] font-bold text-deep-onyx dark:text-pure-mist"></div>
        <div className="relative lg:w-[300px] w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <CustomInput
            type="text"
            placeholder="Search visitors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] h-9"
          />
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-end mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={!hasPrev}
              className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageClick(page)}
                        className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors cursor-pointer ${
                          currentPage === page
                            ? "bg-serene-purple text-white border-serene-purple"
                            : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
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
              onClick={handleNextPage}
              disabled={!hasNext}
              className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {filteredVisitors.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-[12px]">
          No visitors found matching &quot;{searchTerm}&quot;
        </div>
      ) : (
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
                    <TableHead className="min-w-[200px] pl-4 md:pl-8 lg:pl-12 font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                      Connected Since
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentVisitors.map((visitor, index) => {
                    const displayName =
                      visitor.alias_name || visitor.chat_session_id;
                    const matchesName =
                      searchTerm.trim() &&
                      displayName
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase());

                    return (
                      <TableRow
                        key={visitor.sid || visitor.chat_session_id || index}
                        className="cursor-pointer border-b border-gray-100 dark:border-deep-onyx hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20 hover:text-serene-purple dark:hover:text-serene-purple transition-all duration-200"
                      >
                        {/* Visitor name / alias */}
                        <TableCell className="font-medium py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx dark:text-pure-mist w-[260px] min-w-[180px] max-w-[260px]">
                          <span className="flex items-center gap-2">
                            <span className="truncate max-w-[240px] overflow-hidden text-ellipsis">
                              {matchesName
                                ? highlightMatch(displayName, searchTerm)
                                : displayName}
                            </span>
                            {visitor.newly_joined && (
                              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-green/15 text-teal-green dark:bg-teal-green/20 dark:text-teal-green">
                                new
                              </span>
                            )}
                          </span>
                        </TableCell>

                        {/* Status pill */}
                        <TableCell className="min-w-[120px] py-4 px-[10px] text-[14px] whitespace-nowrap">
                          <Badge>online</Badge>
                        </TableCell>

                        {/* Connected since */}
                        <TableCell className="min-w-[200px] pl-4 md:pl-8 lg:pl-12 py-4 px-[10px] text-[14px] whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {visitor.last_connected_at
                            ? formatDateTime12hr(visitor.last_connected_at)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Right gradient for mobile horizontal scroll */}
          {showRightGradient && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
          )}
        </div>
      )}
    </div>
  );
}
