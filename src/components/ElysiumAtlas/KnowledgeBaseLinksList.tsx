"use client";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { setKnowledgeBaseLinks } from "@/store/reducers/agentBuilderSlice";

const LINKS_PER_PAGE = 4; // 2 rows × 2 columns

export default function KnowledgeBaseLinksList() {
  const dispatch = useDispatch();
  const knowledgeBaseLinks = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseLinks
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [checkedLinks, setCheckedLinks] = useState<Set<number>>(new Set());

  const totalPages = Math.ceil(knowledgeBaseLinks.length / LINKS_PER_PAGE);
  const startIndex = (currentPage - 1) * LINKS_PER_PAGE;
  const endIndex = startIndex + LINKS_PER_PAGE;
  const currentLinks = knowledgeBaseLinks.slice(startIndex, endIndex);

  // Reset to page 1 if current page is out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const handleRemoveLink = (indexToRemove: number) => {
    const updatedLinks = knowledgeBaseLinks.filter(
      (_, index) => index !== indexToRemove
    );
    dispatch(setKnowledgeBaseLinks(updatedLinks));
    // Remove from checked set if it was checked
    setCheckedLinks((prev) => {
      const newSet = new Set(prev);
      newSet.delete(indexToRemove);
      return newSet;
    });
  };

  const handleToggleCheckbox = (index: number) => {
    setCheckedLinks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  if (knowledgeBaseLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="lg:text-[14px] text-[12px] font-bold text-deep-onyx dark:text-pure-mist">
          Extracted Links ({knowledgeBaseLinks.length})
        </div>
        {totalPages > 1 && (
          <div className="text-[11px] text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {currentLinks.map((link, localIndex) => {
          const globalIndex = startIndex + localIndex;
          return (
            <div
              key={globalIndex}
              onClick={() => handleToggleCheckbox(globalIndex)}
              className="group flex items-center justify-between gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 w-full cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Checkbox
                  id={`link-${globalIndex}`}
                  checked={checkedLinks.has(globalIndex)}
                  onCheckedChange={() => handleToggleCheckbox(globalIndex)}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white"
                />
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-[12px] text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate transition-colors"
                  title={link}
                >
                  {link}
                </a>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveLink(globalIndex);
                }}
                className="group/btn p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0 opacity-0 group-hover:opacity-100 cursor-pointer"
                aria-label="Remove link"
              >
                <X className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 group-hover/btn:text-danger-red transition-colors" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
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
              } else if (page === currentPage - 2 || page === currentPage + 2) {
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
            })}
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
}
