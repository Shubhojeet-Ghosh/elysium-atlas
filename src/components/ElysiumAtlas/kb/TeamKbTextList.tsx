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
  listCustomTexts,
  getCustomText,
  deleteCustomText,
  reindexItem,
  searchKbItems,
} from "@/utils/kbItemsApi";
import type { KbCustomTextItem, KbItemStatus } from "@/types/kbItems";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isKbSearchInProgress } from "@/utils/kbSearchUi";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import type { PendingNewText, PendingTextUpdate } from "./TeamKbText";

interface TeamKbTextListProps {
  refreshKey?: number;
  pendingNew?: PendingNewText[];
  pendingUpdates?: PendingTextUpdate[];
  onPendingUpdate?: (update: PendingTextUpdate) => void;
  onRemovePendingNew?: (aliasName: string) => void;
  onClearPendingUpdate?: (kbId: string) => void;
  onAddMore?: () => void;
}

export interface TeamKbTextDisplayItem extends KbCustomTextItem {
  isLocalNew?: boolean;
  localContent?: string;
  isLocalUpdate?: boolean;
}

export default function TeamKbTextList({
  refreshKey = 0,
  pendingNew = [],
  pendingUpdates = [],
  onPendingUpdate,
  onRemovePendingNew,
  onClearPendingUpdate,
  onAddMore,
}: TeamKbTextListProps) {
  const teamRole = useActiveTeamRole();
  const readOnly = !canManageTeamMembers(teamRole);

  const [items, setItems] = useState<KbCustomTextItem[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [alias, setAlias] = useState("");
  const [text, setText] = useState("");
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
  const [isLoadingTexts, setIsLoadingTexts] = useState(false);
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
  const [textToDelete, setTextToDelete] = useState<KbCustomTextItem | null>(
    null,
  );
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

  const fetchTexts = useCallback(
    async (
      page = currentPageRef.current,
      limit = pageSizeRef.current,
      isPolling = false,
    ): Promise<boolean> => {
      if (!isPolling) setIsLoadingTexts(true);

      const activeSearch = searchQueryRef.current;

      try {
        const response = activeSearch
          ? await searchKbItems("custom_text", activeSearch, page, limit)
          : await listCustomTexts(page, limit);

        if (response.success) {
          const texts = response.custom_texts ?? [];
          setItems(texts);
          applyPagination({
            total: response.total ?? 0,
            page: response.page ?? page,
            total_pages: response.total_pages ?? 0,
            has_next: response.has_next ?? false,
            has_prev: response.has_prev ?? false,
          });

          const hasIndexing =
            !activeSearch &&
            texts.some((t) => t.status === "indexing" || t.status === "draft");
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
          "Failed to fetch custom texts";
        if (!isPolling) toast.error(errorMessage);
      } finally {
        if (!isPolling) setIsLoadingTexts(false);
      }
      return false;
    },
    [applyPagination],
  );

  const { stopPolling, startPollingIfNeeded } = useKbListPolling(
    (isPolling) =>
      fetchTexts(currentPageRef.current, pageSizeRef.current, isPolling),
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
    fetchTexts(1, pageSizeRef.current).then((hasIndexing) => {
      if (!searchQueryRef.current) {
        startPollingIfNeeded(hasIndexing);
      }
    });
  }, [debouncedSearchQuery, fetchTexts, startPollingIfNeeded, stopPolling]);

  useEffect(() => {
    if (refreshKey === 0) return;
    stopPolling();
    setCurrentPage(1);
    fetchTexts(1, pageSizeRef.current).then(startPollingIfNeeded);
  }, [refreshKey, fetchTexts, startPollingIfNeeded, stopPolling]);

  const handlePageChange = useCallback(
    (page: number) => {
      stopPolling();
      fetchTexts(page, pageSizeRef.current).then(startPollingIfNeeded);
    },
    [fetchTexts, startPollingIfNeeded, stopPolling],
  );

  const handlePageSizeChange = useCallback(
    (size: VisitorPageSize) => {
      setPageSize(size);
      writeDatasourcePageSize(size);
      stopPolling();
      setCurrentPage(1);
      fetchTexts(1, size).then(startPollingIfNeeded);
    },
    [fetchTexts, startPollingIfNeeded, stopPolling],
  );

  const displayItems = useMemo((): TeamKbTextDisplayItem[] => {
    const pendingUpdateMap = new Map(
      pendingUpdates.map((item) => [item.kb_id, item]),
    );

    const mergedFetched = items.map((item) => {
      const pendingUpdate = pendingUpdateMap.get(item.kb_id);
      if (pendingUpdate) {
        return {
          ...item,
          isLocalUpdate: true,
          localContent: pendingUpdate.content,
        };
      }
      return item;
    });

    if (debouncedSearchQuery.trim()) {
      return mergedFetched;
    }

    const fetchedAliases = new Set(
      items.map((item) => item.custom_text_alias.toLowerCase()),
    );

    const localNewItems: TeamKbTextDisplayItem[] = pendingNew
      .filter(
        (item) => !fetchedAliases.has(item.custom_text_alias.toLowerCase()),
      )
      .map((item) => ({
        kb_id: `local-${item.custom_text_alias}`,
        custom_text_alias: item.custom_text_alias,
        status: "draft" as KbItemStatus,
        updated_at: null,
        isLocalNew: true,
        localContent: item.content,
      }));

    return [...localNewItems, ...mergedFetched];
  }, [items, pendingNew, pendingUpdates, debouncedSearchQuery]);

  const isSearching = isKbSearchInProgress(
    searchTerm,
    debouncedSearchQuery,
    isLoadingTexts,
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

  const checkedTextsCount = selectedItems.length;

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

  const textColumnCount = readOnly ? 2 : 4;
  const emptyTextMessage = debouncedSearchQuery.trim()
    ? `No entries found matching "${debouncedSearchQuery}"`
    : "No text entries found";

  const handleRowClick = async (item: TeamKbTextDisplayItem) => {
    setSelectedKbId(item.kb_id);
    setSelectedStatus(item.isLocalNew ? "new" : item.status);
    setAlias(item.custom_text_alias);
    setText("");
    setOpen(true);

    if (item.isLocalNew && item.localContent) {
      setText(item.localContent);
      return;
    }

    const pendingUpdate = pendingUpdates.find((u) => u.kb_id === item.kb_id);
    if (pendingUpdate) {
      setText(pendingUpdate.content);
      return;
    }

    setIsLoadingDetail(true);

    try {
      NProgress.start();
      const response = await getCustomText(item.kb_id);

      if (response.success && response.custom_text) {
        setText(response.custom_text.content);
      } else {
        toast.error(response.message || "Failed to load text content");
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to load text content",
      );
    } finally {
      setIsLoadingDetail(false);
      NProgress.done();
    }
  };

  const handleUpdate = () => {
    if (!selectedKbId || !text.trim()) return;

    if (selectedStatus === "new" || selectedKbId.startsWith("local-")) {
      toast.info("New entries will be indexed from the bar below.");
      setOpen(false);
      return;
    }

    onPendingUpdate?.({
      kb_id: selectedKbId,
      custom_text_alias: alias.trim(),
      content: text.trim(),
    });
    toast.success("Changes saved locally- use Index to apply");
    setOpen(false);
    setSelectedKbId(null);
  };

  const handleReindex = async () => {
    if (!selectedKbId) return;

    setIsReindexing(true);
    try {
      const response = await reindexItem(selectedKbId, "custom_text");
      if (response.success) {
        toast.success(response.message || "Re-indexing started");
        stopPolling();
        await fetchTexts(currentPageRef.current, pageSizeRef.current).then(
          startPollingIfNeeded,
        );
      } else {
        toast.error(response.message || "Failed to re-index text entry");
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to re-index text entry",
      );
    } finally {
      setIsReindexing(false);
    }
  };

  const handleRemove = (item: TeamKbTextDisplayItem) => {
    if (item.isLocalNew) {
      onRemovePendingNew?.(item.custom_text_alias);
      return;
    }
    setTextToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!textToDelete) return;

    setIsDeleting(true);
    try {
      const response = await deleteCustomText(textToDelete.kb_id);

      if (response.success) {
        toast.success(response.message || "Custom text deleted successfully");
        setDeleteDialogOpen(false);
        setTextToDelete(null);
        setCheckedKbIds((prev) => {
          const next = new Set(prev);
          next.delete(textToDelete.kb_id);
          return next;
        });
        stopPolling();
        await fetchTexts(currentPageRef.current, pageSizeRef.current).then(
          startPollingIfNeeded,
        );
      } else {
        toast.error(response.message || "Failed to delete custom text");
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete custom text",
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
            existingToDelete.map((item) => deleteCustomText(item.kb_id)),
          );
          toast.success(
            `${existingToDelete.length} text ${
              existingToDelete.length === 1 ? "entry" : "entries"
            } deleted successfully`,
          );
        } catch (error: unknown) {
          toast.error(
            extractApiErrorMessage(error, "Failed to delete text entries"),
          );
          return;
        }
      }

      localToRemove.forEach((item) =>
        onRemovePendingNew?.(item.custom_text_alias),
      );

      setCheckedKbIds((prev) => {
        const next = new Set(prev);
        toRemove.forEach((item) => next.delete(item.kb_id));
        return next;
      });

      if (existingToDelete.length > 0) {
        stopPolling();
        await fetchTexts(currentPageRef.current, pageSizeRef.current).then(
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
                  id="master-checkbox-kb-text"
                  checked={allChecked}
                  onCheckedChange={handleToggleAll}
                  className="border-2 border-gray-300 dark:border-gray-500 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                />
                <label
                  htmlFor="master-checkbox-kb-text"
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
                        <DialogTitle>Clear Selected Text Entries</DialogTitle>
                        <DialogDescription>
                          This will remove {checkedTextsCount}{" "}
                          {checkedTextsCount === 1 ? "entry" : "entries"} from
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
                      Text alias
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
                      colSpan={textColumnCount}
                      query={searchTerm.trim()}
                    />
                  ) : isLoadingTexts && tableItems.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={textColumnCount}
                        className="py-10 text-center"
                      >
                        <Spinner className="border-serene-purple dark:border-pure-mist mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : tableItems.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={textColumnCount}
                        className="py-10 text-center text-[12px] text-gray-500 dark:text-gray-400"
                      >
                        {emptyTextMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    tableItems.map((item, displayIndex) => {
                      const aliasLabel =
                        item.custom_text_alias || `Text ${displayIndex + 1}`;
                      const matchesAlias =
                        debouncedSearchQuery.trim() &&
                        item.custom_text_alias
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
                                id={`team-kb-text-${item.kb_id}`}
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
          isLoading={isLoadingTexts}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          className="mt-3 mb-4"
        />
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Custom Text</DialogTitle>
            <DialogDescription>
              This will permanently delete this custom text entry from your
              team&apos;s knowledge base. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <CancelButton className="text-[12px]">Cancel</CancelButton>
            </DialogClose>
            <PrimaryButton
              className="text-[12px] font-semibold bg-danger-red hover:bg-danger-red/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setSelectedKbId(null);
            setSelectedStatus(null);
            setAlias("");
            setText("");
          }
        }}
      >
        <SheetContent className={SHEET_CONTENT_CLASSNAME}>
          <SheetHeader>
            <SheetTitle>
              {readOnly ? "View Text Entry" : "Edit Text Entry"}
            </SheetTitle>
            <SheetDescription className="font-medium">
              {readOnly
                ? "View the content of this text entry."
                : "Make changes to your text entry here. Click save when you're done."}
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
                  <Label htmlFor="text-alias">Text alias</Label>
                  <CustomInput
                    id="text-alias"
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Enter text alias"
                    className="w-full px-[12px] py-[10px] cursor-not-allowed"
                    disabled
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="text-content">Text</Label>
                  <CustomTextareaPrimary
                    id="text-content"
                    placeholder="Enter your custom text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full"
                    rows={8}
                    disabled={readOnly}
                    readOnly={readOnly}
                  />
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
                disabled={!text.trim() || isLoadingDetail}
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
    </>
  );
}
