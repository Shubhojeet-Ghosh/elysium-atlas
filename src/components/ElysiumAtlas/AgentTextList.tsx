"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  DialogClose,
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
import Spinner from "@/components/ui/Spinner";
import {
  updateKnowledgeBaseText,
  removeKnowledgeBaseText,
  setKnowledgeBaseText,
} from "@/store/reducers/agentSlice";
import { CustomText } from "@/store/types/AgentBuilderTypes";
import OutlineButton from "@/components/ui/OutlineButton";
import { Trash2, Search, BookOpen } from "lucide-react";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import NProgress from "nprogress";
import { formatDateTime12hr } from "@/utils/formatDate";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";
import { useAppSelector } from "@/store";
import { listAttachedCustomTexts, updateAgentKb } from "@/utils/agentKbApi";
import {
  buildKbAttachmentsFromState,
  getTextAgentKbDisplayStatus,
  mapAttachedCustomTextsToState,
  mergeTextsWithPending,
  paginateItems,
} from "@/utils/agentKbUtils";
import KbStatusBadge from "./kb/KbStatusBadge";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import AgentKbPickFromLibraryDialog, {
  type AgentKbLibraryPick,
} from "./kb/AgentKbPickFromLibraryDialog";
import { useAgentAttachedListLoad } from "./kb/useAgentAttachedListLoad";
import { useIsKbBuildFlow } from "./kb/KbDatasourceModeContext";
import {
  useKbTextState,
  useKbLinksState,
  useKbFilesState,
  useKbQnAState,
  useKbAgentId,
  useKbDatasourceActions,
} from "./kb/useKbDatasourceState";

interface AgentTextListProps {
  items?: never[];
  onEdit?: (index: number) => void;
  onRemove?: (index: number) => void;
  onAddMore?: () => void;
}

export default function AgentTextList({
  items: _items,
  onEdit: _onEdit,
  onRemove: _onRemove,
  onAddMore,
}: AgentTextListProps = {}) {
  const isBuild = useIsKbBuildFlow();
  const kbActions = useKbDatasourceActions();
  const dispatch = useDispatch();
  const readOnly = useAgentReadOnly();
  const knowledgeBaseText = useKbTextState();
  const knowledgeBaseLinks = useKbLinksState();
  const knowledgeBaseFiles = useKbFilesState();
  const knowledgeBaseQnA = useKbQnAState();
  const agentID = useKbAgentId();
  const triggerFetchAgentCustomTexts = useAppSelector(
    (state) => state.agent.triggerFetchAgentCustomTexts,
  );
  const triggerGetAgentDetails = useAppSelector(
    (state) => state.agent.triggerGetAgentDetails,
  );
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [alias, setAlias] = useState("");
  const [text, setText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(() =>
    readDatasourcePageSize(),
  );
  const [isLoadingTexts, setIsLoadingTexts] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pageSizeRef = useRef(pageSize);
  const currentPageRef = useRef(currentPage);
  const knowledgeBaseTextRef = useRef(knowledgeBaseText);
  pageSizeRef.current = pageSize;
  currentPageRef.current = currentPage;
  knowledgeBaseTextRef.current = knowledgeBaseText;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [textToDelete, setTextToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const mergeWithNewTexts = useCallback((mappedTexts: CustomText[]) => {
    const fetchedAliases = new Set(
      mappedTexts.map((t) => t.custom_text_alias.toLowerCase()),
    );
    const newItems = knowledgeBaseTextRef.current.filter(
      (item) =>
        item.status === "new" &&
        !fetchedAliases.has(item.custom_text_alias.toLowerCase()),
    );
    return [...newItems, ...mappedTexts];
  }, []);

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

  const fetchAgentCustomTexts = useCallback(
    async (
      page = currentPageRef.current,
      limit = pageSizeRef.current,
      isPolling = false,
    ): Promise<boolean> => {
      if (!agentID) return false;

      if (!isPolling) setIsLoadingTexts(true);

      try {
        const response = await listAttachedCustomTexts(agentID, page, limit);

        if (response.success === true) {
          const mappedTexts = mapAttachedCustomTextsToState(
            response.custom_texts ?? [],
          );
          dispatch(
            setKnowledgeBaseText(
              mergeTextsWithPending(mappedTexts, knowledgeBaseTextRef.current),
            ),
          );

          applyPagination({
            total: response.total,
            page: response.page,
            total_pages: response.total_pages,
            has_next: response.has_next,
            has_prev: response.has_prev,
          });

          const hasIndexing = mappedTexts.some(
            (t) => t.status === "indexing" || t.status === "draft",
          );
          if (!hasIndexing) stopPolling();
          return hasIndexing;
        }
      } catch (error: unknown) {
        if (!isPolling) {
          toast.error(
            extractApiErrorMessage(error, "Failed to fetch agent custom texts"),
          );
        }
        stopPolling();
      } finally {
        if (!isPolling) setIsLoadingTexts(false);
      }
      return false;
    },
    [agentID, dispatch, applyPagination],
  );

  const startPollingIfNeeded = useCallback(
    (hasIndexing: boolean) => {
      if (hasIndexing && !pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchAgentCustomTexts(
            currentPageRef.current,
            pageSizeRef.current,
            true,
          );
        }, 5000);
      }
    },
    [fetchAgentCustomTexts],
  );

  useAgentAttachedListLoad(
    isBuild ? undefined : agentID,
    [triggerFetchAgentCustomTexts, triggerGetAgentDetails],
    () => {
      setCurrentPage(1);
      fetchAgentCustomTexts(1, pageSizeRef.current).then(startPollingIfNeeded);
    },
    stopPolling,
  );

  const buildCurrentKbState = () => ({
    knowledgeBaseLinks,
    knowledgeBaseFiles,
    knowledgeBaseText,
    knowledgeBaseQnA,
  });

  const detachTextsByKbIds = async (kbIds: string[]) => {
    if (isBuild) {
      const remainingTexts = knowledgeBaseText.filter(
        (item) => !item.kb_id || !kbIds.includes(item.kb_id),
      );
      kbActions.setKnowledgeBaseText(remainingTexts);
      return;
    }

    if (!agentID) throw new Error("Agent ID not found");

    const remainingTexts = knowledgeBaseText.filter(
      (item) => !item.kb_id || !kbIds.includes(item.kb_id),
    );
    const response = await updateAgentKb(agentID, {
      kb_attachments: buildKbAttachmentsFromState({
        ...buildCurrentKbState(),
        knowledgeBaseText: remainingTexts,
      }),
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to detach text entry");
    }
  };

  const handleAttachFromLibrary = (items: AgentKbLibraryPick[]) => {
    const existingKbIds = new Set(
      knowledgeBaseText.map((item) => item.kb_id).filter(Boolean),
    );
    const existingAliases = new Set(
      knowledgeBaseText.map((item) => item.custom_text_alias.toLowerCase()),
    );

    const newRows: CustomText[] = items
      .filter(
        (item) =>
          !existingKbIds.has(item.kb_id) &&
          !existingAliases.has(item.label.toLowerCase()),
      )
      .map((item) => ({
        kb_id: item.kb_id,
        custom_text_alias: item.label,
        custom_text: "",
        lastUpdated: new Date().toISOString(),
        status: "pending_attach",
      }));

    if (newRows.length === 0) {
      toast.info("Selected text entries are already attached or pending");
      return;
    }

    kbActions.setKnowledgeBaseText([...newRows, ...knowledgeBaseText]);
    toast.success(
      isBuild
        ? `${newRows.length} text entr${newRows.length === 1 ? "y" : "ies"} added from library`
        : `${newRows.length} team text entr${newRows.length === 1 ? "y" : "ies"} added from library- save to attach`,
    );
  };

  const handlePageChange = useCallback(
    (page: number) => {
      if (isBuild) {
        setCurrentPage(page);
        return;
      }
      stopPolling();
      fetchAgentCustomTexts(page, pageSizeRef.current).then(
        startPollingIfNeeded,
      );
    },
    [fetchAgentCustomTexts, startPollingIfNeeded, isBuild],
  );

  const handlePageSizeChange = useCallback(
    (size: VisitorPageSize) => {
      setPageSize(size);
      writeDatasourcePageSize(size);
      setCurrentPage(1);
      if (isBuild) return;
      stopPolling();
      fetchAgentCustomTexts(1, size).then(startPollingIfNeeded);
    },
    [fetchAgentCustomTexts, startPollingIfNeeded, isBuild],
  );

  // Filter texts based on search term (alias only- content not loaded for API items)
  const filteredTexts = useMemo(() => {
    if (!searchTerm.trim()) {
      return knowledgeBaseText;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return knowledgeBaseText.filter((item) =>
      item.custom_text_alias.toLowerCase().includes(lowerSearchTerm),
    );
  }, [knowledgeBaseText, searchTerm]);

  const currentTexts = useMemo(() => {
    return filteredTexts.map((item) => ({
      item,
      originalIndex: knowledgeBaseText.findIndex(
        (t) => t.custom_text_alias === item.custom_text_alias,
      ),
    }));
  }, [filteredTexts, knowledgeBaseText]);

  const listPagination = useMemo(
    () => paginateItems(currentTexts, currentPage, pageSize),
    [currentTexts, currentPage, pageSize],
  );

  const displayTexts = isBuild ? listPagination.pageItems : currentTexts;

  const displayPagination = isBuild
    ? {
        currentPage: listPagination.totalPages > 0 ? currentPage : 1,
        totalPages: listPagination.totalPages,
        hasNext: listPagination.hasNext,
        hasPrev: listPagination.hasPrev,
        total: listPagination.total,
      }
    : {
        currentPage,
        totalPages,
        hasNext,
        hasPrev,
        total,
      };

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
  }, [currentTexts]);

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

  const unsavedNewCount = knowledgeBaseText.filter(
    (t) => t.status === "new",
  ).length;
  const displayTotal = total + unsavedNewCount;
  const textColumnCount = readOnly ? 2 : 3;
  const emptyTextMessage = searchTerm
    ? `No entries found matching "${searchTerm}"`
    : isBuild
      ? "No text entries added yet"
      : "No text entries found";

  const handleRowClick = async (aliasName: string) => {
    // Find the item by alias name in the Redux store
    const itemIndex = knowledgeBaseText.findIndex(
      (item) =>
        item.custom_text_alias.toLowerCase() === aliasName.toLowerCase(),
    );

    if (itemIndex !== -1) {
      const item = knowledgeBaseText[itemIndex];
      setSelectedIndex(itemIndex);
      setAlias(item.custom_text_alias);

      // If the item was fetched from the API and doesn't have content loaded yet, fetch it
      if (item.status !== "new" && !item.custom_text) {
        try {
          NProgress.start();
          const token = Cookies.get("elysium_atlas_session_token");

          const response = await fastApiAxios.post(
            "/elysium-agents/elysium-atlas/agent/v1/get-custom-text-content",
            {
              agent_id: agentID,
              custom_text_alias: item.custom_text_alias,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (response.data.success && response.data.text_content) {
            // Update Redux with the fetched content
            kbActions.updateKnowledgeBaseText({
              index: itemIndex,
              customText: {
                ...item,
                custom_text: response.data.text_content,
              },
            });
            setText(response.data.text_content);
          } else {
            // If fetch failed, still open but with empty content
            setText("");
          }
        } catch (error: any) {
          console.error("Error fetching custom text content:", error);
          // Still open the sheet even if fetch failed
          setText("");
        } finally {
          NProgress.done();
        }
      } else {
        // For new items or existing items with content already loaded
        setText(item.custom_text);
      }

      setOpen(true);
    }
  };

  const handleUpdate = () => {
    if (selectedIndex !== null && text.trim()) {
      kbActions.updateKnowledgeBaseText({
        index: selectedIndex,
        customText: {
          custom_text_alias: alias.trim(),
          custom_text: text.trim(),
          lastUpdated: new Date().toISOString(),
          status: "new",
        },
      });
      setOpen(false);
      setSelectedIndex(null);
    }
  };

  const handleRemove = (aliasName: string, isExisting: boolean) => {
    if (!isBuild && isExisting) {
      setTextToDelete(aliasName);
      setDeleteDialogOpen(true);
    } else {
      const itemIndex = knowledgeBaseText.findIndex(
        (item) =>
          item.custom_text_alias.toLowerCase() === aliasName.toLowerCase(),
      );
      if (itemIndex !== -1) {
        kbActions.removeKnowledgeBaseText(itemIndex);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!textToDelete) return;

    setIsDeleting(true);
    try {
      const target = knowledgeBaseText.find(
        (item) =>
          item.custom_text_alias.toLowerCase() === textToDelete.toLowerCase(),
      );
      if (
        !isBuild &&
        target?.kb_id &&
        target.status !== "new" &&
        target.status !== "pending_attach"
      ) {
        await detachTextsByKbIds([target.kb_id]);
        toast.success("Text entry detached from agent");
      }

      const itemIndex = knowledgeBaseText.findIndex(
        (item) =>
          item.custom_text_alias.toLowerCase() === textToDelete.toLowerCase(),
      );
      if (itemIndex !== -1) {
        kbActions.removeKnowledgeBaseText(itemIndex);
      }
      setDeleteDialogOpen(false);
      setTextToDelete(null);
    } catch (error: unknown) {
      toast.error(
        extractApiErrorMessage(error, "Failed to detach custom text"),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="w-full overflow-hidden">
        <div className="flex items-center justify-end mb-4 px-0 w-full min-w-0">
          <div className="flex items-center gap-2 w-full min-w-0 md:w-auto">
            {!readOnly && (
              <PrimaryButton
                className="text-[12px] font-semibold flex items-center justify-center gap-2 min-h-[41px] h-[41px] px-[16px] !py-0 shrink-0"
                onClick={() => setLibraryDialogOpen(true)}
              >
                <BookOpen className="mr-0 md:mr-1" size={14} />
                Library
              </PrimaryButton>
            )}
            {!readOnly && onAddMore && (
              <OutlineButton
                className="text-[12px] font-semibold flex items-center justify-center gap-2 min-h-[41px] h-[41px] px-[16px] !py-0 border-[2px] shrink-0"
                onClick={onAddMore}
              >
                <span className="text-[16px] leading-none">+</span>
                <span className="hidden md:inline">Add More</span>
              </OutlineButton>
            )}
            <div className="relative flex-1 min-w-0 h-[41px] md:flex-none md:w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <CustomInput
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[41px] min-h-[41px] pl-9 pr-3 text-[12px]"
              />
            </div>
          </div>
        </div>

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
                      Text alias
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
                  {isLoadingTexts && displayTexts.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={textColumnCount}
                        className="py-10 text-center"
                      >
                        <Spinner className="border-serene-purple dark:border-pure-mist mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : displayTexts.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={textColumnCount}
                        className="py-10 text-center text-[12px] text-gray-500 dark:text-gray-400"
                      >
                        {emptyTextMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayTexts.map(
                      ({ item, originalIndex }, displayIndex) => {
                        const alias =
                          item.custom_text_alias || `Text ${displayIndex + 1}`;
                        const matchesAlias =
                          searchTerm.trim() &&
                          item.custom_text_alias
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase());

                        return (
                          <TableRow
                            key={
                              item.custom_text_alias || `text-${originalIndex}`
                            }
                            onClick={() =>
                              handleRowClick(item.custom_text_alias)
                            }
                            className="cursor-pointer hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20"
                          >
                            <TableCell className="font-medium min-w-[120px] lg:min-w-[100px] lg:max-w-[200px] py-2 lg:px-4 px-0 text-[12px] whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">
                                  {matchesAlias
                                    ? highlightMatch(alias, searchTerm)
                                    : alias}
                                </span>
                                <KbStatusBadge
                                  status={getTextAgentKbDisplayStatus(item)}
                                />
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
                                    handleRemove(
                                      item.custom_text_alias,
                                      item.status !== "new",
                                    );
                                  }}
                                  className="p-2 rounded-[8px] text-danger-red hover:bg-danger-red hover:text-white transition-colors cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      },
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {showRightGradient && displayTexts.length > 0 && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
          )}
        </div>

        <TablePaginationControls
          currentPage={
            isBuild ? displayPagination.currentPage : currentPage
          }
          totalPages={
            isBuild ? displayPagination.totalPages : totalPages
          }
          hasNext={isBuild ? displayPagination.hasNext : hasNext}
          hasPrev={isBuild ? displayPagination.hasPrev : hasPrev}
          total={isBuild ? displayPagination.total : total}
          totalRecords={
            isBuild
              ? displayPagination.total
              : total + unsavedNewCount
          }
          pageSize={pageSize}
          pageSizeOptions={VISITOR_PAGE_SIZE_OPTIONS}
          isLoading={isLoadingTexts}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          className="mt-3 mb-4"
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Custom Text</DialogTitle>
            <DialogDescription>
              This will permanently delete this custom text entry from your
              agent's knowledge base. This action cannot be undone.
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
            setSelectedIndex(null);
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
            <div className="grid gap-3">
              <Label htmlFor="text-alias">Text alias</Label>
              <CustomInput
                id="text-alias"
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Enter text alias"
                className={`w-full px-[12px] py-[10px] ${
                  selectedIndex !== null &&
                  knowledgeBaseText[selectedIndex]?.status !== "new"
                    ? "cursor-not-allowed"
                    : ""
                }`}
                disabled={
                  readOnly ||
                  (selectedIndex !== null &&
                    knowledgeBaseText[selectedIndex]?.status !== "new")
                }
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
          </div>
          <SheetFooter className="flex-col gap-2">
            {!readOnly && (
              <PrimaryButton
                type="button"
                onClick={handleUpdate}
                disabled={!text.trim()}
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
      <AgentKbPickFromLibraryDialog
        open={libraryDialogOpen}
        onOpenChange={setLibraryDialogOpen}
        sourceType="custom_text"
        excludeKbIds={knowledgeBaseText
          .map((item) => item.kb_id)
          .filter((kbId): kbId is string => Boolean(kbId))}
        onConfirm={handleAttachFromLibrary}
      />
    </>
  );
}
