"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePaginationControls from "../TablePaginationControls";
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import PrimaryButton from "@/components/ui/PrimaryButton";
import CancelButton from "@/components/ui/CancelButton";
import Spinner from "@/components/ui/Spinner";
import OutlineButton from "@/components/ui/OutlineButton";
import KbStatusBadge from "./KbStatusBadge";
import KbSearchingTableRow from "./KbSearchingTableRow";
import { useKbListPolling } from "./useKbListPolling";
import { Trash2, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import NProgress from "nprogress";
import { formatDateTime12hr } from "@/utils/formatDate";
import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";
import { canManageTeamMembers } from "@/utils/teamPermissions";
import {
  listQnAPairs,
  getQnAPair,
  deleteQnAPair,
  reindexItem,
  searchKbItems,
} from "@/utils/kbItemsApi";
import type { KbQnAItem, KbItemStatus } from "@/types/kbItems";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isKbSearchInProgress } from "@/utils/kbSearchUi";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import type { PendingNewQnA, PendingQnAUpdate } from "./TeamKbQnA";

interface TeamKbQnAListProps {
  refreshKey?: number;
  pendingNew?: PendingNewQnA[];
  pendingUpdates?: PendingQnAUpdate[];
  onPendingUpdate?: (update: PendingQnAUpdate) => void;
  onRemovePendingNew?: (aliasName: string) => void;
  onAddMore?: () => void;
}

export interface TeamKbQnADisplayItem extends KbQnAItem {
  isLocalNew?: boolean;
  localQuestion?: string;
  localAnswer?: string;
  isLocalUpdate?: boolean;
}

export default function TeamKbQnAList({
  refreshKey = 0,
  pendingNew = [],
  pendingUpdates = [],
  onPendingUpdate,
  onRemovePendingNew,
  onAddMore,
}: TeamKbQnAListProps) {
  const teamRole = useActiveTeamRole();
  const readOnly = !canManageTeamMembers(teamRole);

  const [items, setItems] = useState<KbQnAItem[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [alias, setAlias] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(() =>
    readDatasourcePageSize(),
  );
  const [isLoadingQnA, setIsLoadingQnA] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchTerm, 300);
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageSizeRef = useRef(pageSize);
  const currentPageRef = useRef(currentPage);
  const searchQueryRef = useRef(debouncedSearchQuery);
  pageSizeRef.current = pageSize;
  currentPageRef.current = currentPage;
  searchQueryRef.current = debouncedSearchQuery.trim();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [checkedKbIds, setCheckedKbIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [qnaToDelete, setQnaToDelete] = useState<KbQnAItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const fetchQnA = useCallback(
    async (
      page = currentPageRef.current,
      limit = pageSizeRef.current,
      isPolling = false,
    ): Promise<boolean> => {
      if (!isPolling) setIsLoadingQnA(true);

      const activeSearch = searchQueryRef.current;

      try {
        const response = activeSearch
          ? await searchKbItems("qa_pair", activeSearch, page, limit)
          : await listQnAPairs(page, limit);

        if (response.success) {
          const qaPairs = response.qa_pairs ?? [];
          setItems(qaPairs);
          applyPagination({
            total: response.total ?? 0,
            page: response.page ?? page,
            total_pages: response.total_pages ?? 0,
            has_next: response.has_next ?? false,
            has_prev: response.has_prev ?? false,
          });

          const hasIndexing =
            !activeSearch &&
            qaPairs.some(
              (q) => q.status === "indexing" || q.status === "draft",
            );
          return hasIndexing;
        }
      } catch (error: unknown) {
        const err = error as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch QnA pairs";
        if (!isPolling) toast.error(errorMessage);
      } finally {
        if (!isPolling) setIsLoadingQnA(false);
      }
      return false;
    },
    [applyPagination],
  );

  const { stopPolling, startPollingIfNeeded } = useKbListPolling(
    (isPolling) =>
      fetchQnA(currentPageRef.current, pageSizeRef.current, isPolling),
    [pageSize],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      stopPolling();
      setItems([]);
      if (!value.trim()) {
        setCurrentPage(1);
      }
    },
    [stopPolling],
  );

  const prevDebouncedSearchRef = useRef(debouncedSearchQuery);
  useEffect(() => {
    if (prevDebouncedSearchRef.current === debouncedSearchQuery) return;
    prevDebouncedSearchRef.current = debouncedSearchQuery;

    stopPolling();
    setCurrentPage(1);
    fetchQnA(1, pageSizeRef.current).then((hasIndexing) => {
      if (!searchQueryRef.current) {
        startPollingIfNeeded(hasIndexing);
      }
    });
  }, [debouncedSearchQuery, fetchQnA, startPollingIfNeeded, stopPolling]);

  useEffect(() => {
    if (refreshKey === 0) return;
    stopPolling();
    setCurrentPage(1);
    fetchQnA(1, pageSizeRef.current).then(startPollingIfNeeded);
  }, [refreshKey, fetchQnA, startPollingIfNeeded, stopPolling]);

  const handlePageChange = useCallback(
    (page: number) => {
      stopPolling();
      fetchQnA(page, pageSizeRef.current).then(startPollingIfNeeded);
    },
    [fetchQnA, startPollingIfNeeded, stopPolling],
  );

  const handlePageSizeChange = useCallback(
    (size: VisitorPageSize) => {
      setPageSize(size);
      writeDatasourcePageSize(size);
      stopPolling();
      setCurrentPage(1);
      fetchQnA(1, size).then(startPollingIfNeeded);
    },
    [fetchQnA, startPollingIfNeeded, stopPolling],
  );

  const displayItems = useMemo((): TeamKbQnADisplayItem[] => {
    const pendingUpdateMap = new Map(
      pendingUpdates.map((item) => [item.kb_id, item]),
    );

    const mergedFetched = items.map((item) => {
      const pendingUpdate = pendingUpdateMap.get(item.kb_id);
      if (pendingUpdate) {
        return {
          ...item,
          isLocalUpdate: true,
          localQuestion: pendingUpdate.question,
          localAnswer: pendingUpdate.answer,
        };
      }
      return item;
    });

    if (debouncedSearchQuery.trim()) {
      return mergedFetched;
    }

    const fetchedAliases = new Set(
      items.map((item) => item.qna_alias.toLowerCase()),
    );

    const localNewItems: TeamKbQnADisplayItem[] = pendingNew
      .filter((item) => !fetchedAliases.has(item.qna_alias.toLowerCase()))
      .map((item) => ({
        kb_id: `local-${item.qna_alias}`,
        qna_alias: item.qna_alias,
        status: "draft" as KbItemStatus,
        updated_at: null,
        isLocalNew: true,
        localQuestion: item.question,
        localAnswer: item.answer,
      }));

    return [...localNewItems, ...mergedFetched];
  }, [items, pendingNew, pendingUpdates, debouncedSearchQuery]);

  const isSearching = isKbSearchInProgress(
    searchTerm,
    debouncedSearchQuery,
    isLoadingQnA,
  );
  const tableItems = isSearching ? [] : displayItems;

  const selectedItems = useMemo(
    () => tableItems.filter((item) => checkedKbIds.has(item.kb_id)),
    [tableItems, checkedKbIds],
  );

  const allChecked =
    tableItems.length > 0 &&
    tableItems.every((item) => checkedKbIds.has(item.kb_id));

  const hasUnchecked = tableItems.some((item) => !checkedKbIds.has(item.kb_id));

  const hasChecked = tableItems.some((item) => checkedKbIds.has(item.kb_id));

  const checkedQnaCount = selectedItems.length;

  const handleToggleCheckbox = (kbId: string) => {
    setCheckedKbIds((prev) => {
      const next = new Set(prev);
      if (next.has(kbId)) {
        next.delete(kbId);
      } else {
        next.add(kbId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    setCheckedKbIds((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        tableItems.forEach((item) => next.delete(item.kb_id));
      } else {
        tableItems.forEach((item) => next.add(item.kb_id));
      }
      return next;
    });
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 5;
      setShowRightGradient(!isAtEnd);
    };

    handleScroll();
    scrollContainer.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [tableItems]);

  const highlightMatch = (label: string, term: string) => {
    if (!term.trim()) {
      return label;
    }

    const lowerText = label.toLowerCase();
    const lowerSearchTerm = term.toLowerCase();
    const index = lowerText.indexOf(lowerSearchTerm);

    if (index === -1) {
      return label;
    }

    const beforeMatch = label.substring(0, index);
    const match = label.substring(index, index + term.length);
    const afterMatch = label.substring(index + term.length);

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

  const qnaColumnCount = readOnly ? 2 : 4;
  const emptyQnaMessage = debouncedSearchQuery.trim()
    ? `No entries found matching "${debouncedSearchQuery}"`
    : "No QnA entries found";

  const handleRowClick = async (item: TeamKbQnADisplayItem) => {
    setSelectedKbId(item.kb_id);
    setSelectedStatus(item.isLocalNew ? "new" : item.status);
    setAlias(item.qna_alias);
    setQuestion("");
    setAnswer("");
    setOpen(true);

    if (item.isLocalNew) {
      setQuestion(item.localQuestion ?? "");
      setAnswer(item.localAnswer ?? "");
      return;
    }

    const pendingUpdate = pendingUpdates.find((u) => u.kb_id === item.kb_id);
    if (pendingUpdate) {
      setQuestion(pendingUpdate.question);
      setAnswer(pendingUpdate.answer);
      return;
    }

    setIsLoadingDetail(true);

    try {
      NProgress.start();
      const response = await getQnAPair(item.kb_id);

      if (response.success && response.qa_pair) {
        setQuestion(response.qa_pair.question);
        setAnswer(response.qa_pair.answer);
      } else {
        toast.error(response.message || "Failed to load QnA content");
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to load QnA content",
      );
    } finally {
      setIsLoadingDetail(false);
      NProgress.done();
    }
  };

  const handleUpdate = () => {
    if (!selectedKbId || !question.trim() || !answer.trim()) return;

    if (selectedStatus === "new" || selectedKbId.startsWith("local-")) {
      toast.info("New entries will be indexed from the bar below.");
      setOpen(false);
      return;
    }

    onPendingUpdate?.({
      kb_id: selectedKbId,
      qna_alias: alias.trim(),
      question: question.trim(),
      answer: answer.trim(),
    });
    toast.success("Changes saved locally- use Index to apply");
    setOpen(false);
    setSelectedKbId(null);
  };

  const handleReindex = async () => {
    if (!selectedKbId) return;

    setIsReindexing(true);
    try {
      const response = await reindexItem(selectedKbId, "qa_pair");
      if (response.success) {
        toast.success(response.message || "Re-indexing started");
        stopPolling();
        await fetchQnA(currentPageRef.current, pageSizeRef.current).then(
          startPollingIfNeeded,
        );
      } else {
        toast.error(response.message || "Failed to re-index QnA entry");
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to re-index QnA entry",
      );
    } finally {
      setIsReindexing(false);
    }
  };

  const handleRemove = (item: TeamKbQnADisplayItem) => {
    if (item.isLocalNew) {
      onRemovePendingNew?.(item.qna_alias);
      return;
    }
    setQnaToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!qnaToDelete) return;

    setIsDeleting(true);
    try {
      const response = await deleteQnAPair(qnaToDelete.kb_id);

      if (response.success) {
        toast.success(response.message || "QnA entry deleted successfully");
        setDeleteDialogOpen(false);
        setQnaToDelete(null);
        setCheckedKbIds((prev) => {
          const next = new Set(prev);
          next.delete(qnaToDelete.kb_id);
          return next;
        });
        stopPolling();
        await fetchQnA(currentPageRef.current, pageSizeRef.current).then(
          startPollingIfNeeded,
        );
      } else {
        toast.error(response.message || "Failed to delete QnA entry");
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete QnA entry",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmClearSelected = async () => {
    const toRemove = selectedItems;
    const existingToDelete = toRemove.filter((item) => !item.isLocalNew);
    const localToRemove = toRemove.filter((item) => item.isLocalNew);

    setClearDialogOpen(false);
    NProgress.start();

    try {
      if (existingToDelete.length > 0) {
        setIsDeleting(true);
        try {
          await Promise.all(
            existingToDelete.map((item) => deleteQnAPair(item.kb_id)),
          );
          toast.success(
            `${existingToDelete.length} QnA ${
              existingToDelete.length === 1 ? "entry" : "entries"
            } deleted successfully`,
          );
        } catch (error: unknown) {
          toast.error(
            extractApiErrorMessage(error, "Failed to delete QnA entries"),
          );
          return;
        }
      }

      localToRemove.forEach((item) => onRemovePendingNew?.(item.qna_alias));

      setCheckedKbIds((prev) => {
        const next = new Set(prev);
        toRemove.forEach((item) => next.delete(item.kb_id));
        return next;
      });

      if (existingToDelete.length > 0) {
        stopPolling();
        await fetchQnA(currentPageRef.current, pageSizeRef.current).then(
          startPollingIfNeeded,
        );
      }
    } finally {
      setIsDeleting(false);
      NProgress.done();
    }
  };

  return (
    <>
      <div className="w-full overflow-hidden">
        <div className="flex items-center justify-end mb-4 px-0">
          <div className="flex items-center gap-2">
            {!readOnly && onAddMore && (
              <OutlineButton
                className="text-[12px] font-semibold flex items-center justify-center gap-2 min-h-[41px] h-[41px] px-[16px] !py-0 border-[2px]"
                onClick={onAddMore}
              >
                <span className="text-[16px] leading-none">+</span>
                <span className="hidden md:inline">Add More</span>
              </OutlineButton>
            )}
            <div className="relative w-[200px] h-[41px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <CustomInput
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full h-[41px] min-h-[41px] pl-9 pr-3 text-[12px]"
              />
            </div>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center justify-between mb-3 px-[10px] flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="master-checkbox-kb-qna"
                  checked={allChecked}
                  onCheckedChange={handleToggleAll}
                  className="border-2 border-gray-300 dark:border-gray-500 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                />
                <label
                  htmlFor="master-checkbox-kb-qna"
                  className="text-[12px] font-semibold text-deep-onyx dark:text-pure-mist cursor-pointer min-w-[70px]"
                >
                  {hasUnchecked ? "Select All" : "Unselect All"}
                </label>
              </div>
              {hasChecked && (
                <>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                  <Dialog
                    open={clearDialogOpen}
                    onOpenChange={setClearDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-1.5 text-[12px] font-semibold text-danger-red hover:underline cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">Clear Selected</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Clear Selected QnA Entries</DialogTitle>
                        <DialogDescription>
                          This will remove {checkedQnaCount}{" "}
                          {checkedQnaCount === 1 ? "entry" : "entries"} from
                          your knowledge base. This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <PrimaryButton className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx">
                            Cancel
                          </PrimaryButton>
                        </DialogClose>
                        <PrimaryButton
                          className="text-[12px] font-semibold bg-danger-red hover:bg-danger-red/90 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleConfirmClearSelected}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Confirm"}
                        </PrimaryButton>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        )}

        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto md:overflow-visible"
          >
            <div className="inline-block min-w-full align-middle">
              <Table className="w-full table-fixed min-w-[600px] lg:min-w-full">
                <colgroup>
                  {!readOnly && <col className="w-[40px]" />}
                  <col />
                  <col className="w-[32%]" />
                  {!readOnly && <col className="w-[60px]" />}
                </colgroup>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {!readOnly && (
                      <TableHead className="font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap" />
                    )}
                    <TableHead className="font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                      QnA alias
                    </TableHead>
                    <TableHead className="font-[600] py-3 pl-8 md:pl-12 pr-[10px] text-[14px] whitespace-nowrap">
                      Last updated
                    </TableHead>
                    {!readOnly && (
                      <TableHead className="w-[60px] text-right font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap" />
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isSearching ? (
                    <KbSearchingTableRow
                      colSpan={qnaColumnCount}
                      query={searchTerm.trim()}
                    />
                  ) : isLoadingQnA && tableItems.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={qnaColumnCount}
                        className="py-10 text-center"
                      >
                        <Spinner className="border-serene-purple dark:border-pure-mist mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : tableItems.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={qnaColumnCount}
                        className="py-10 text-center text-[12px] text-gray-500 dark:text-gray-400"
                      >
                        {emptyQnaMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    tableItems.map((item, displayIndex) => {
                      const aliasLabel =
                        item.qna_alias || `QnA ${displayIndex + 1}`;
                      const matchesAlias =
                        debouncedSearchQuery.trim() &&
                        item.qna_alias
                          .toLowerCase()
                          .includes(debouncedSearchQuery.toLowerCase());

                      return (
                        <TableRow
                          key={item.kb_id}
                          onClick={() => handleRowClick(item)}
                          className="border-b border-gray-100 dark:border-deep-onyx transition-all duration-200 cursor-pointer hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20"
                        >
                          {!readOnly && (
                            <TableCell className="py-4 px-[10px] whitespace-nowrap">
                              <Checkbox
                                id={`team-kb-qna-${item.kb_id}`}
                                checked={checkedKbIds.has(item.kb_id)}
                                onCheckedChange={() =>
                                  handleToggleCheckbox(item.kb_id)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="border-2 border-gray-300 dark:border-gray-500 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium py-4 px-[10px] text-[12px] text-deep-onyx dark:text-pure-mist whitespace-nowrap overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">
                                {matchesAlias
                                  ? highlightMatch(
                                      aliasLabel,
                                      debouncedSearchQuery,
                                    )
                                  : aliasLabel}
                              </span>
                              <KbStatusBadge
                                mode="team"
                                status={
                                  item.isLocalNew || item.isLocalUpdate
                                    ? "new"
                                    : item.status
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="py-4 pl-8 md:pl-12 pr-[10px] text-[12px] whitespace-nowrap text-gray-500 dark:text-gray-400">
                            {item.updated_at
                              ? formatDateTime12hr(item.updated_at)
                              : "—"}
                          </TableCell>
                          {!readOnly && (
                            <TableCell className="w-[60px] text-right py-4 px-[10px] whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemove(item);
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
          {showRightGradient && tableItems.length > 0 && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
          )}
        </div>

        <TablePaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          total={total}
          totalRecords={
            debouncedSearchQuery.trim() ? total : total + pendingNew.length
          }
          pageSize={pageSize}
          pageSizeOptions={VISITOR_PAGE_SIZE_OPTIONS}
          isLoading={isLoadingQnA}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          className="mt-3 mb-4"
        />
      </div>

      <Sheet
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setSelectedKbId(null);
            setSelectedStatus(null);
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
            {isLoadingDetail ? (
              <div className="flex justify-center py-12">
                <Spinner className="border-serene-purple dark:border-pure-mist" />
              </div>
            ) : (
              <>
                <div className="grid gap-3">
                  <Label htmlFor="qna-alias">QnA alias</Label>
                  <CustomInput
                    id="qna-alias"
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Enter QnA alias"
                    className="w-full px-[12px] py-[10px] cursor-not-allowed"
                    disabled
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
              </>
            )}
          </div>
          <SheetFooter className="flex-col gap-2">
            {!readOnly && selectedStatus === "failed" && (
              <PrimaryButton
                type="button"
                onClick={handleReindex}
                disabled={isReindexing || isLoadingDetail}
                className="w-full text-[12px] font-semibold"
              >
                <RefreshCw
                  size={14}
                  className={`mr-2 inline ${isReindexing ? "animate-spin" : ""}`}
                />
                {isReindexing ? "Re-indexing..." : "Re-index"}
              </PrimaryButton>
            )}
            {!readOnly && (
              <PrimaryButton
                type="button"
                onClick={handleUpdate}
                disabled={!question.trim() || !answer.trim() || isLoadingDetail}
                className="w-full text-[12px] font-semibold"
              >
                Save changes
              </PrimaryButton>
            )}
            <SheetClose asChild>
              <CancelButton
                type="button"
                className="w-full text-[12px] font-semibold"
              >
                {readOnly ? "Close" : "Cancel"}
              </CancelButton>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete QnA Entry</DialogTitle>
            <DialogDescription>
              This will permanently delete this QnA entry from your team&apos;s
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
