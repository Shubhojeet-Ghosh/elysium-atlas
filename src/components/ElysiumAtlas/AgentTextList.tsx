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
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import {
  updateKnowledgeBaseText,
  removeKnowledgeBaseText,
  setKnowledgeBaseText,
} from "@/store/reducers/agentSlice";
import { CustomText } from "@/store/types/AgentBuilderTypes";
import OutlineButton from "@/components/ui/OutlineButton";
import { Trash2, Search } from "lucide-react";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import NProgress from "nprogress";
import { formatDateTime12hr } from "@/utils/formatDate";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";
import { useAppSelector } from "@/store";

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
  const dispatch = useDispatch();
  const readOnly = useAgentReadOnly();
  const knowledgeBaseText = useSelector(
    (state: RootState) => state.agent.knowledgeBaseText,
  );
  const agentID = useSelector((state: RootState) => state.agent.agentID);
  const triggerFetchAgentCustomTexts = useAppSelector(
    (state) => state.agent.triggerFetchAgentCustomTexts,
  );
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
      const token = Cookies.get("elysium_atlas_session_token");

      try {
        const response = await fastApiAxios.post(
          "/elysium-agents/elysium-atlas/agent/v1/get-agent-custom-texts",
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
          const texts = response.data.custom_texts || [];
          const mappedTexts: CustomText[] = texts.map((textItem: any) => ({
            custom_text_alias: textItem.custom_text_alias,
            custom_text: "",
            lastUpdated: textItem.updated_at || textItem.created_at || "",
            status: textItem.status ?? "indexed",
          }));

          dispatch(setKnowledgeBaseText(mergeWithNewTexts(mappedTexts)));
          applyPagination({
            total: response.data.total ?? 0,
            page: response.data.page ?? page,
            total_pages: response.data.total_pages ?? 0,
            has_next: response.data.has_next ?? false,
            has_prev: response.data.has_prev ?? false,
          });

          const hasIndexing = mappedTexts.some((t) => t.status === "indexing");
          if (!hasIndexing) stopPolling();
          return hasIndexing;
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch agent custom texts";
        if (!isPolling) toast.error(errorMessage);
        stopPolling();
      } finally {
        if (!isPolling) setIsLoadingTexts(false);
      }
      return false;
    },
    [agentID, dispatch, mergeWithNewTexts, applyPagination],
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

  useEffect(() => {
    if (!agentID) return;
    setCurrentPage(1);
    fetchAgentCustomTexts(1, pageSizeRef.current).then(startPollingIfNeeded);
    return () => stopPolling();
  }, [agentID, fetchAgentCustomTexts, startPollingIfNeeded]);

  useEffect(() => {
    if (!agentID || triggerFetchAgentCustomTexts === 0) return;
    stopPolling();
    setCurrentPage(1);
    fetchAgentCustomTexts(1, pageSizeRef.current).then(startPollingIfNeeded);
  }, [
    triggerFetchAgentCustomTexts,
    agentID,
    fetchAgentCustomTexts,
    startPollingIfNeeded,
  ]);

  const handlePageChange = useCallback(
    (page: number) => {
      stopPolling();
      fetchAgentCustomTexts(page, pageSizeRef.current).then(
        startPollingIfNeeded,
      );
    },
    [fetchAgentCustomTexts, startPollingIfNeeded],
  );

  const handlePageSizeChange = useCallback(
    (size: VisitorPageSize) => {
      setPageSize(size);
      writeDatasourcePageSize(size);
      stopPolling();
      setCurrentPage(1);
      fetchAgentCustomTexts(1, size).then(startPollingIfNeeded);
    },
    [fetchAgentCustomTexts, startPollingIfNeeded],
  );

  // Filter texts based on search term (alias only — content not loaded for API items)
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
    return filteredTexts.map((item, originalIndex) => ({
      item,
      originalIndex: knowledgeBaseText.findIndex(
        (t) => t.custom_text_alias === item.custom_text_alias,
      ),
    }));
  }, [filteredTexts, knowledgeBaseText]);

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
            dispatch(
              updateKnowledgeBaseText({
                index: itemIndex,
                customText: {
                  ...item,
                  custom_text: response.data.text_content,
                },
              }),
            );
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
      dispatch(
        updateKnowledgeBaseText({
          index: selectedIndex,
          customText: {
            custom_text_alias: alias.trim(),
            custom_text: text.trim(),
            lastUpdated: new Date().toISOString(),
            status: "new",
          },
        }),
      );
      setOpen(false);
      setSelectedIndex(null);
    }
  };

  const handleRemove = (aliasName: string, isExisting: boolean) => {
    if (isExisting) {
      // Show confirmation dialog for existing texts
      setTextToDelete(aliasName);
      setDeleteDialogOpen(true);
    } else {
      // For new texts, remove directly from Redux
      const itemIndex = knowledgeBaseText.findIndex(
        (item) =>
          item.custom_text_alias.toLowerCase() === aliasName.toLowerCase(),
      );
      if (itemIndex !== -1) {
        dispatch(removeKnowledgeBaseText(itemIndex));
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!textToDelete) return;

    if (!agentID) {
      toast.error("Agent ID not found");
      return;
    }

    setIsDeleting(true);
    const token = Cookies.get("elysium_atlas_session_token");

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/delete-agent-custom-data",
        {
          agent_id: agentID,
          custom_texts: [textToDelete],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        toast.success(
          response.data.message || "Custom text deleted successfully",
        );
        // Remove from Redux
        const itemIndex = knowledgeBaseText.findIndex(
          (item) =>
            item.custom_text_alias.toLowerCase() === textToDelete.toLowerCase(),
        );
        if (itemIndex !== -1) {
          dispatch(removeKnowledgeBaseText(itemIndex));
        }
        setDeleteDialogOpen(false);
        setTextToDelete(null);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete custom text";
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
            Text Entries ({displayTotal})
            {searchTerm && (
              <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                ({filteredTexts.length} found)
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
          isLoading={isLoadingTexts}
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
                  {isLoadingTexts && currentTexts.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={textColumnCount}
                        className="py-10 text-center"
                      >
                        <Spinner className="border-serene-purple dark:border-pure-mist mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : currentTexts.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={textColumnCount}
                        className="py-10 text-center text-[12px] text-gray-500 dark:text-gray-400"
                      >
                        {emptyTextMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentTexts.map(
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
                                ) : item.status !== "indexed" &&
                                  item.status !== "active" ? (
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                      item.status === "indexing"
                                        ? "bg-serene-purple/10 text-[#6c5f8d] dark:bg-serene-purple/20 dark:text-[#c4bcd6]"
                                        : item.status === "failed" ||
                                            item.status === "error"
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                          : item.status === "pending"
                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                    }`}
                                  >
                                    {item.status === "indexing" ? (
                                      <span className="inline-flex items-center gap-[2px]">
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
                                    ) : (
                                      item.status.charAt(0).toUpperCase() +
                                      item.status.slice(1)
                                    )}
                                  </span>
                                ) : null}
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
          {showRightGradient && currentTexts.length > 0 && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
          )}
        </div>
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
        <SheetContent className="w-full max-w-[380px] z-[110] px-[4px]">
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
    </>
  );
}
