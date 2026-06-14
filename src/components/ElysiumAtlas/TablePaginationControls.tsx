"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import CustomInput from "@/components/inputs/CustomInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VISITOR_PAGE_SIZE_OPTIONS,
  type VisitorPageSize,
} from "@/lib/config";

export interface TablePaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  pageSize: number;
  pageSizeOptions?: readonly number[];
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: VisitorPageSize) => void;
}

export default function TablePaginationControls({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  total,
  pageSize,
  pageSizeOptions = VISITOR_PAGE_SIZE_OPTIONS,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
}: TablePaginationControlsProps) {
  const [pageInput, setPageInput] = useState("1");

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const paginationBtnClass =
    "p-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors";

  const effectiveTotalPages = Math.max(1, totalPages);
  const paginationDisabled = total === 0 || isLoading;

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
    const target = Math.min(
      Math.max(1, effectiveTotalPages),
      Math.max(1, parsed),
    );
    setPageInput(String(target));
    if (target !== currentPage) onPageChange(target);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 mb-3">
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
          onClick={() => hasPrev && onPageChange(currentPage - 1)}
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
                    onClick={() => onPageChange(page)}
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
          onClick={() => hasNext && onPageChange(currentPage + 1)}
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
      </div>

      <div className="flex items-center justify-between w-full sm:contents">
        <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
          <span className="whitespace-nowrap">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              onPageSizeChange(Number(value) as VisitorPageSize)
            }
            disabled={isLoading}
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

        <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
          <span className="whitespace-nowrap">Go to</span>
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
            className="w-[52px] h-9 text-center text-[13px] py-2 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="whitespace-nowrap">of {effectiveTotalPages}</span>
        </div>
      </div>
    </div>
  );
}
