"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import PrimaryButton from "@/components/ui/PrimaryButton";
import CancelButton from "@/components/ui/CancelButton";
import {
  updateKnowledgeBaseQnA,
  removeKnowledgeBaseQnA,
} from "@/store/reducers/agentBuilderSlice";
import { Trash2, ChevronLeft, ChevronRight, Search } from "lucide-react";

const QNA_PER_PAGE = 10;

interface KnowledgeBaseQnAListProps {
  items?: never[];
  onEdit?: (index: number) => void;
  onRemove?: (index: number) => void;
}

export default function KnowledgeBaseQnAList({
  items: _items,
  onEdit: _onEdit,
  onRemove: _onRemove,
}: KnowledgeBaseQnAListProps = {}) {
  const dispatch = useDispatch();
  const knowledgeBaseQnA = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseQnA
  );
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [alias, setAlias] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter QnA based on search term (alias, question, or answer)
  const filteredQnA = useMemo(() => {
    if (!searchTerm.trim()) {
      return knowledgeBaseQnA;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return knowledgeBaseQnA.filter(
      (item) =>
        item.qna_alias.toLowerCase().includes(lowerSearchTerm) ||
        item.question.toLowerCase().includes(lowerSearchTerm) ||
        item.answer.toLowerCase().includes(lowerSearchTerm)
    );
  }, [knowledgeBaseQnA, searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Sort by lastUpdated (newest first)
  const sortedQnA = useMemo(() => {
    return [...filteredQnA]
      .map((item, originalIndex) => ({ item, originalIndex }))
      .sort(
        (a, b) =>
          new Date(b.item.lastUpdated).getTime() -
          new Date(a.item.lastUpdated).getTime()
      );
  }, [filteredQnA]);

  const totalPages = Math.ceil(sortedQnA.length / QNA_PER_PAGE);
  const startIndex = (currentPage - 1) * QNA_PER_PAGE;
  const endIndex = startIndex + QNA_PER_PAGE;
  const currentQnA = sortedQnA.slice(startIndex, endIndex);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Handle scroll to detect if we're at the end
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      // Check if we're at or near the end (within 5px threshold)
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 5;
      setShowRightGradient(!isAtEnd);
    };

    // Check initial state
    handleScroll();

    scrollContainer.addEventListener("scroll", handleScroll);
    // Also check on resize
    window.addEventListener("resize", handleScroll);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [currentQnA]);

  // Function to highlight matching text in alias
  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) {
      return text;
    }

    const lowerText = text.toLowerCase();
    const lowerSearchTerm = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerSearchTerm);

    if (index === -1) {
      return text;
    }

    const beforeMatch = text.substring(0, index);
    const match = text.substring(index, index + searchTerm.length);
    const afterMatch = text.substring(index + searchTerm.length);

    return (
      <>
        {beforeMatch}
        <span className="bg-serene-purple/80 text-white font-semibold">
          {match}
        </span>
        {afterMatch}
      </>
    );
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

  if (knowledgeBaseQnA.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRowClick = (aliasName: string) => {
    // Find the item by alias name in the Redux store
    const itemIndex = knowledgeBaseQnA.findIndex(
      (item) => item.qna_alias.toLowerCase() === aliasName.toLowerCase()
    );

    if (itemIndex !== -1) {
      const item = knowledgeBaseQnA[itemIndex];
      setSelectedIndex(itemIndex);
      setAlias(item.qna_alias);
      setQuestion(item.question);
      setAnswer(item.answer);
      setOpen(true);
    }
  };

  const handleUpdate = () => {
    if (selectedIndex !== null && question.trim() && answer.trim()) {
      dispatch(
        updateKnowledgeBaseQnA({
          index: selectedIndex,
          qna: {
            qna_alias: alias.trim(),
            question: question.trim(),
            answer: answer.trim(),
            lastUpdated: new Date().toISOString(),
          },
        })
      );
      setOpen(false);
      setSelectedIndex(null);
    }
  };

  const handleRemove = (aliasName: string) => {
    // Find the item by alias name in the Redux store
    const itemIndex = knowledgeBaseQnA.findIndex(
      (item) => item.qna_alias.toLowerCase() === aliasName.toLowerCase()
    );

    if (itemIndex !== -1) {
      dispatch(removeKnowledgeBaseQnA(itemIndex));
    }
  };

  return (
    <>
      <div className="w-full mt-[12px] overflow-hidden">
        {/* Search Bar */}
        <div className="flex items-center justify-between mb-4 px-0">
          <div className="lg:text-[14px] text-[12px] font-bold text-deep-onyx dark:text-pure-mist">
            QnA Entries ({knowledgeBaseQnA.length})
            {searchTerm && (
              <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                ({filteredQnA.length} found)
              </span>
            )}
          </div>
          {knowledgeBaseQnA.length > 0 && (
            <div className="relative w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <CustomInput
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[11px] h-8"
              />
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-end mb-3 ">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
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
                  }
                )}
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
          </div>
        )}

        {filteredQnA.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-[12px] px-4 md:px-0">
            No entries found matching "{searchTerm}"
          </div>
        ) : (
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto md:overflow-visible"
            >
              <div className="inline-block min-w-full align-middle">
                <Table className="min-w-[600px] lg:min-w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[120px] lg:min-w-[100px] lg:max-w-[200px] font-[600] py-2 lg:px-4 px-0 whitespace-nowrap">
                        QnA alias
                      </TableHead>
                      <TableHead className="min-w-[200px] pl-4 md:pl-8 lg:pl-12 font-[600] py-2 lg:px-4 px-0 whitespace-nowrap">
                        Last updated
                      </TableHead>
                      <TableHead className="w-[60px] md:w-[80px] text-right font-[600] py-2 lg:px-4 px-0 whitespace-nowrap"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentQnA.map(({ item, originalIndex }, displayIndex) => {
                      const alias = item.qna_alias || `QnA ${displayIndex + 1}`;
                      const matchesAlias =
                        searchTerm.trim() &&
                        item.qna_alias
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase());

                      return (
                        <TableRow
                          key={item.qna_alias || `qna-${originalIndex}`}
                          onClick={() => handleRowClick(item.qna_alias)}
                          className="cursor-pointer hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20 hover:text-serene-purple dark:hover:text-serene-purple transition-all duration-200"
                        >
                          <TableCell className="font-medium min-w-[120px] lg:min-w-[100px] lg:max-w-[200px] py-2 lg:px-4 px-0 text-[12px] whitespace-nowrap">
                            <div className="truncate">
                              {matchesAlias
                                ? highlightMatch(alias, searchTerm)
                                : alias}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[200px] pl-4 md:pl-8 lg:pl-12 py-2 lg:px-4 px-0 text-[12px] whitespace-nowrap">
                            {formatDate(item.lastUpdated)}
                          </TableCell>
                          <TableCell className="w-[60px] md:w-[80px] text-right py-2 lg:px-4 px-0 whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(item.qna_alias);
                              }}
                              className="p-2 rounded-[8px] text-danger-red hover:bg-danger-red hover:text-white transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
            {/* Right gradient overlay - fixed to viewport */}
            {showRightGradient && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
            )}
          </div>
        )}
      </div>

      <Sheet
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setSelectedIndex(null);
            setAlias("");
            setQuestion("");
            setAnswer("");
          }
        }}
      >
        <SheetContent className="min-w-full lg:min-w-[480px] md:min-w-full z-[110] px-[4px]">
          <SheetHeader>
            <SheetTitle>Edit QnA Entry</SheetTitle>
            <SheetDescription className="font-medium">
              Make changes to your QnA entry here. Click save when you&apos;re
              done.
            </SheetDescription>
          </SheetHeader>
          <div className="grid flex-1 auto-rows-min gap-6 px-4 py-6">
            <div className="grid gap-3">
              <Label htmlFor="qna-alias">QnA alias</Label>
              <CustomInput
                id="qna-alias"
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Enter QnA alias"
                className="w-full px-[12px] py-[10px]"
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="grid gap-3">
                <Label htmlFor="question-content">Question</Label>
                <CustomTextareaPrimary
                  id="question-content"
                  placeholder="Enter your question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full"
                  rows={4}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="answer-content">Answer</Label>
                <CustomTextareaPrimary
                  id="answer-content"
                  placeholder="Enter your answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full"
                  rows={4}
                />
              </div>
            </div>
          </div>
          <SheetFooter className="flex-col gap-2">
            <PrimaryButton
              type="button"
              onClick={handleUpdate}
              disabled={!question.trim() || !answer.trim()}
              className="w-full text-[12px] font-semibold"
            >
              Save changes
            </PrimaryButton>
            <SheetClose asChild>
              <CancelButton
                type="button"
                className="w-full text-[12px] font-semibold "
              >
                Cancel
              </CancelButton>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
