"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import CustomInput from "@/components/inputs/CustomInput";

interface EmailTablePaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function EmailTablePagination({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  total,
  onPageChange,
  className = "",
}: EmailTablePaginationProps) {
  const [pageInput, setPageInput] = useState(String(currentPage));
  const effectiveTotalPages = Math.max(1, totalPages);
  const paginationDisabled = total === 0;

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const paginationBtnClass =
    "p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors";

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
    <div
      className={`flex flex-row flex-nowrap items-center justify-end gap-2 overflow-x-auto ${className}`}
    >
      <div className="flex items-center justify-end gap-1.5 flex-nowrap shrink-0">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={paginationDisabled || currentPage <= 1}
            className={paginationBtnClass}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={paginationDisabled || !hasPrev}
            className={paginationBtnClass}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
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
                          ? "opacity-50 cursor-not-allowed border-gray-200 text-gray-700"
                          : "cursor-pointer"
                      } ${
                        !paginationDisabled && currentPage === page
                          ? "bg-serene-purple text-white border-serene-purple"
                          : !paginationDisabled
                            ? "border-gray-200 text-gray-700 hover:bg-gray-50"
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
                      className="px-1 text-[11px] text-gray-400"
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
            onClick={() => onPageChange(currentPage + 1)}
            disabled={paginationDisabled || !hasNext}
            className={paginationBtnClass}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(effectiveTotalPages)}
            disabled={
              paginationDisabled || currentPage >= effectiveTotalPages
            }
            className={paginationBtnClass}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-[12px] text-gray-500 shrink-0">
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
  );
}
