"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { RootState } from "@/store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePaginationControls from "./TablePaginationControls";
import {
  readDatasourcePageSize,
  writeDatasourcePageSize,
  VISITOR_PAGE_SIZE_OPTIONS,
  type VisitorPageSize,
} from "@/lib/config";
import { SHEET_CONTENT_CLASSNAME } from "@/lib/sheetConfig";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import PrimaryButton from "@/components/ui/PrimaryButton";
import CancelButton from "@/components/ui/CancelButton";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import {
  updateKnowledgeBaseQnA,
  removeKnowledgeBaseQnA,
  setKnowledgeBaseQnA,
} from "@/store/reducers/agentSlice";
import OutlineButton from "@/components/ui/OutlineButton";
import { Trash2, Search } from "lucide-react";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import NProgress from "nprogress";
import { formatDateTime12hr } from "@/utils/formatDate";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";

interface KnowledgeBaseQnAListProps {
  items?: never[];
  onEdit?: (index: number) => void;
  onRemove?: (index: number) => void;
  onAddMore?: () => void;
}

export default function KnowledgeBaseQnAList({
  items: _items,
  onEdit: _onEdit,
  onRemove: _onRemove,
  onAddMore,
}: KnowledgeBaseQnAListProps = {}) {
  const dispatch = useAppDispatch();
  const readOnly = useAgentReadOnly();
  const knowledgeBaseQnA = useAppSelector(
    (state) => state.agent.knowledgeBaseQnA,
  );
  const agentID = useAppSelector((state) => state.agent.agentID);
  const triggerFetchAgentQnA = useAppSelector(
    (state) => state.agent.triggerFetchAgentQnA,
  );
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [alias, setAlias] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(() =>
    readDatasourcePageSize(),
  );
  const [isLoadingQnA, setIsLoadingQnA] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pageSizeRef = useRef(pageSize);
  const currentPageRef = useRef(currentPage);
  const knowledgeBaseQnARef = useRef(knowledgeBaseQnA);
  pageSizeRef.current = pageSize;
  currentPageRef.current = currentPage;
  knowledgeBaseQnARef.current = knowledgeBaseQnA;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qnaToDelete, setQnaToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const mergeWithNewQnA = useCallback(
    (
      mappedQnA: {
        qna_alias: string;
        question: string;
        answer: string;
        lastUpdated: string;
        status: string;
      }[],
    ) => {
      const fetchedAliases = new Set(
        mappedQnA.map((q) => q.qna_alias.toLowerCase()),
      );
      const newItems = knowledgeBaseQnARef.current.filter(
        (item) =>
          item.status === "new" &&
          !fetchedAliases.has(item.qna_alias.toLowerCase()),
      );
      return [...newItems, ...mappedQnA];
    },
    [],
  );

  const applyPagination = useCallback(
    (payload: {
      total: number;
      page: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    }) => {
      setCurrentPage(payload.page);
      setTotal(payload.total);
      setHasNext(payload.has_next);
      setHasPrev(payload.has_prev);
      setTotalPages(
        payload.total_pages > 0
          ? payload.total_pages
          : payload.total > 0
            ? Math.max(1, Math.ceil(payload.total / pageSizeRef.current))
            : 0,
      );
    },
    [],
  );

  const fetchQAPairs = useCallback(
    async (
      page = currentPageRef.current,
      limit = pageSizeRef.current,
      isPolling = false,
    ): Promise<boolean> => {
      if (!agentID) return false;

      if (!isPolling) setIsLoadingQnA(true);
      const token = Cookies.get("elysium_atlas_session_token");

      try {
        const response = await fastApiAxios.post(
          "/elysium-agents/elysium-atlas/agent/v1/get-agent-qa-pairs",
          {
            agent_id: agentID,
            page,
            limit,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success === true) {
          const qaPairs = response.data.qa_pairs || [];
          const mappedQnA = qaPairs.map((item: any) => ({
            qna_alias: item.qna_alias,
            question: "",
            answer: "",
            lastUpdated: item.updated_at || item.created_at,
            status: item.status ?? "indexed",
          }));

          dispatch(setKnowledgeBaseQnA(mergeWithNewQnA(mappedQnA)));
          applyPagination({
            total: response.data.total ?? 0,
            page: response.data.page ?? page,
            total_pages: response.data.total_pages ?? 0,
            has_next: response.data.has_next ?? false,
            has_prev: response.data.has_prev ?? false,
          });

          const hasIndexing = mappedQnA.some(
            (q: { status: string }) =>
              q.status !== "active" && q.status !== "indexed",
          );
          if (!hasIndexing) stopPolling();
          return hasIndexing;
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch QA pairs";
        if (!isPolling) toast.error(errorMessage);
        stopPolling();
      } finally {
        if (!isPolling) setIsLoadingQnA(false);
      }
      return false;
    },
    [agentID, dispatch, mergeWithNewQnA, applyPagination],
  );

  const startPollingIfNeeded = useCallback(
    (hasIndexing: boolean) => {
      if (hasIndexing && !pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchQAPairs(currentPageRef.current, pageSizeRef.current, true);
        }, 5000);
      }
    },
    [fetchQAPairs],
  );

  useEffect(() => {
    if (!agentID) return;
    setCurrentPage(1);
    fetchQAPairs(1, pageSizeRef.current).then(startPollingIfNeeded);
    return () => stopPolling();
  }, [agentID, fetchQAPairs, startPollingIfNeeded]);

  useEffect(() => {
    if (!agentID || triggerFetchAgentQnA === 0) return;
    stopPolling();
    setCurrentPage(1);
    fetchQAPairs(1, pageSizeRef.current).then(startPollingIfNeeded);
  }, [triggerFetchAgentQnA, agentID, fetchQAPairs, startPollingIfNeeded]);

  const handlePageChange = useCallback(
    (page: number) => {
      stopPolling();
      fetchQAPairs(page, pageSizeRef.current).then(startPollingIfNeeded);
    },
    [fetchQAPairs, startPollingIfNeeded],
  );

  const handlePageSizeChange = useCallback(
    (size: VisitorPageSize) => {
      setPageSize(size);
      writeDatasourcePageSize(size);
      stopPolling();
      setCurrentPage(1);
      fetchQAPairs(1, size).then(startPollingIfNeeded);
    },
    [fetchQAPairs, startPollingIfNeeded],
  );

  // Filter QnA based on search term (alias only — content loaded on demand)
  const filteredQnA = useMemo(() => {
    if (!searchTerm.trim()) {
      return knowledgeBaseQnA;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return knowledgeBaseQnA.filter((item) =>
      item.qna_alias.toLowerCase().includes(lowerSearchTerm),
    );
  }, [knowledgeBaseQnA, searchTerm]);

  const currentQnA = useMemo(() => {
    return filteredQnA.map((item) => ({
      item,
      originalIndex: knowledgeBaseQnA.findIndex(
        (q) => q.qna_alias === item.qna_alias,
      ),
    }));
  }, [filteredQnA, knowledgeBaseQnA]);

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

  const unsavedNewCount = knowledgeBaseQnA.filter(
    (q) => q.status === "new",
  ).length;
  const displayTotal = total + unsavedNewCount;
  const qnaColumnCount = readOnly ? 2 : 3;
  const emptyQnaMessage = searchTerm
    ? `No entries found matching "${searchTerm}"`
    : "No QnA entries found";

  const handleRowClick = async (aliasName: string) => {
    // Find the item by alias name in the Redux store
    const itemIndex = knowledgeBaseQnA.findIndex(
      (item) => item.qna_alias.toLowerCase() === aliasName.toLowerCase(),
    );

    if (itemIndex !== -1) {
      const item = knowledgeBaseQnA[itemIndex];
      setSelectedIndex(itemIndex);
      setAlias(item.qna_alias);

      // If the item was fetched from the API and doesn't have content loaded yet, fetch it
      if (item.status !== "new" && !item.question && !item.answer) {
        try {
          NProgress.start();
          const token = Cookies.get("elysium_atlas_session_token");

          const response = await fastApiAxios.post(
            "/elysium-agents/elysium-atlas/agent/v1/get-qa-pair-content",
            {
              agent_id: agentID,
              qna_alias: item.qna_alias,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (
            response.data.success &&
            response.data.question &&
            response.data.answer
          ) {
            // Update Redux with the fetched content
            dispatch(
              updateKnowledgeBaseQnA({
                index: itemIndex,
                qna: {
                  ...item,
                  question: response.data.question,
                  answer: response.data.answer,
                },
              }),
            );
            setQuestion(response.data.question);
            setAnswer(response.data.answer);
          } else {
            // If fetch failed, still open but with empty content
            setQuestion("");
            setAnswer("");
          }
        } catch (error: any) {
          console.error("Error fetching QA pair content:", error);
          // Still open the sheet even if fetch failed
          setQuestion("");
          setAnswer("");
        } finally {
          NProgress.done();
        }
      } else {
        // For new items or existing items with content already loaded
        setQuestion(item.question);
        setAnswer(item.answer);
      }

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
            status: "new",
          },
        }),
      );
      setOpen(false);
      setSelectedIndex(null);
    }
  };

  const handleRemove = (aliasName: string) => {
    // Find the item by alias name in the Redux store
    const itemIndex = knowledgeBaseQnA.findIndex(
      (item) => item.qna_alias.toLowerCase() === aliasName.toLowerCase(),
    );

    if (itemIndex !== -1) {
      const item = knowledgeBaseQnA[itemIndex];

      // If item is new, remove directly without confirmation
      if (item.status === "new") {
        dispatch(removeKnowledgeBaseQnA(itemIndex));
        toast.success("QnA entry removed");
        return;
      }

      // For existing items, show confirmation dialog
      setQnaToDelete(aliasName);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!qnaToDelete) return;

    setIsDeleting(true);
    const token = Cookies.get("elysium_atlas_session_token");

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/delete-agent-custom-data",
        {
          agent_id: agentID,
          qa_pairs: [qnaToDelete],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        toast.success(
          response.data.message || "QnA entry deleted successfully",
        );

        // Remove from Redux
        const itemIndex = knowledgeBaseQnA.findIndex(
          (item) => item.qna_alias.toLowerCase() === qnaToDelete.toLowerCase(),
        );
        if (itemIndex !== -1) {
          dispatch(removeKnowledgeBaseQnA(itemIndex));
        }

        setDeleteDialogOpen(false);
        setQnaToDelete(null);
      } else {
        toast.error("Failed to delete QnA entry");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete QnA entry";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="w-full mt-[12px] overflow-hidden">
        {/* Search Bar */}
        <div className="flex items-center justify-between mb-4 px-0">
          <div className="lg:text-[14px] text-[12px] font-bold text-deep-onyx dark:text-pure-mist">
            QnA Entries ({displayTotal})
            {searchTerm && (
              <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                ({filteredQnA.length} found)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && onAddMore && (
              <OutlineButton
                className="text-[12px] font-bold px-3 py-1 h-8"
                onClick={onAddMore}
              >
                <span className="text-[18px]">+</span>{" "}
                <span className="hidden md:inline">Add More</span>
              </OutlineButton>
            )}
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
          </div>
        </div>

        {/* Pagination Controls */}
        <TablePaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          total={total}
          pageSize={pageSize}
          pageSizeOptions={VISITOR_PAGE_SIZE_OPTIONS}
          isLoading={isLoadingQnA}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />

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
                    {!readOnly && (
                      <TableHead className="w-[60px] md:w-[80px] text-right font-[600] py-2 lg:px-4 px-0 whitespace-nowrap"></TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingQnA && currentQnA.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={qnaColumnCount}
                        className="py-10 text-center"
                      >
                        <Spinner className="border-serene-purple dark:border-pure-mist mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : currentQnA.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={qnaColumnCount}
                        className="py-10 text-center text-[12px] text-gray-500 dark:text-gray-400"
                      >
                        {emptyQnaMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentQnA.map(({ item, originalIndex }, displayIndex) => {
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
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">
                                {matchesAlias
                                  ? highlightMatch(alias, searchTerm)
                                  : alias}
                              </span>
                              {item.status === "new" ? (
                                <Badge>New</Badge>
                              ) : item.status === "indexing" ? (
                                <span className="inline-flex items-center gap-[2px] px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-serene-purple/10 text-[#6c5f8d] dark:bg-serene-purple/20 dark:text-[#c4bcd6]">
                                  <span>Indexing</span>
                                  <span className="inline-flex items-end gap-[2px] ml-[2px]">
                                    {[0, 0.2, 0.4].map((delay, i) => (
                                      <span
                                        key={i}
                                        style={{
                                          display: "inline-block",
                                          width: "3px",
                                          height: "3px",
                                          borderRadius: "50%",
                                          background: "currentColor",
                                          animation: `bounce-dot 1.2s ${delay}s infinite ease-in-out`,
                                        }}
                                      />
                                    ))}
                                  </span>
                                </span>
                              ) : item.status === "failed" ||
                                item.status === "error" ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                                  {item.status.charAt(0).toUpperCase() +
                                    item.status.slice(1)}
                                </span>
                              ) : item.status === "pending" ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                  Pending
                                </span>
                              ) : item.status === "active" ? null : null}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[200px] pl-4 md:pl-8 lg:pl-12 py-2 lg:px-4 px-0 text-[12px] whitespace-nowrap">
                            {formatDateTime12hr(item.lastUpdated)}
                          </TableCell>
                          {!readOnly && (
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
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {showRightGradient && currentQnA.length > 0 && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
          )}
        </div>
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
        <SheetContent className={SHEET_CONTENT_CLASSNAME}>
          <SheetHeader>
            <SheetTitle>
              {readOnly ? "View QnA Entry" : "Edit QnA Entry"}
            </SheetTitle>
            <SheetDescription className="font-medium">
              {readOnly
                ? "View the content of this QnA entry."
                : "Make changes to your QnA entry here. Click save when you're done."}
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
                className={`w-full px-[12px] py-[10px] ${
                  selectedIndex !== null &&
                  knowledgeBaseQnA[selectedIndex]?.status !== "new"
                    ? "cursor-not-allowed"
                    : ""
                }`}
                disabled={
                  readOnly ||
                  (selectedIndex !== null &&
                    knowledgeBaseQnA[selectedIndex]?.status !== "new")
                }
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
                  disabled={readOnly}
                  readOnly={readOnly}
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
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
            </div>
          </div>
          <SheetFooter className="flex-col gap-2">
            {!readOnly && (
              <PrimaryButton
                type="button"
                onClick={handleUpdate}
                disabled={!question.trim() || !answer.trim()}
                className="w-full text-[12px] font-semibold"
              >
                Save changes
              </PrimaryButton>
            )}
            <SheetClose asChild>
              <CancelButton
                type="button"
                className="w-full text-[12px] font-semibold "
              >
                {readOnly ? "Close" : "Cancel"}
              </CancelButton>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete QnA Entry</DialogTitle>
            <DialogDescription>
              This will permanently delete this QnA entry from your agent's
              knowledge base. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <CancelButton
              type="button"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="text-[12px] font-semibold"
            >
              Cancel
            </CancelButton>
            <PrimaryButton
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="text-[12px] font-semibold bg-danger-red hover:bg-danger-red/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
