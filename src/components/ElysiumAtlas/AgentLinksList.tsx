"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  X,
  Search,
  ExternalLink,
  Trash2,
  Trash,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePaginationControls from "./TablePaginationControls";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
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
import {
  toggleKnowledgeBaseLink,
  toggleAllKnowledgeBaseLinks,
  removeKnowledgeBaseLink,
  setKnowledgeBaseLinks,
  setTriggerFetchAgentUrls,
} from "@/store/reducers/agentSlice";
import { useAppSelector } from "@/store";
import { KnowledgeBaseLink } from "@/store/types/AgentBuilderTypes";
import CustomInput from "@/components/inputs/CustomInput";
import { toast } from "sonner";
import OutlineButton from "@/components/ui/OutlineButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import NProgress from "nprogress";
import { formatDateTime12hr } from "@/utils/formatDate";
import AgentKbPickFromLibraryDialog, {
  type AgentKbLibraryPick,
} from "./kb/AgentKbPickFromLibraryDialog";
import TeamKbAddWebsiteDialog from "./kb/TeamKbAddWebsiteDialog";
import TeamKbAddSitemapDialog from "./kb/TeamKbAddSitemapDialog";
import KbStatusBadge from "./kb/KbStatusBadge";
import {
  buildKbAttachmentsFromState,
  getLinkAgentKbDisplayStatus,
  paginateItems,
} from "@/utils/agentKbUtils";
import { reindexKbItem, updateAgentKb } from "@/utils/agentKbApi";
import { pingUrl } from "@/utils/kbItemsApi";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import {
  isOnAgentListByUrl,
  LIBRARY_REUSE_TOAST,
  resolveLinkForAgentAdd,
  resolveLinksForAgentAdd,
} from "@/utils/teamKbLookup";
import { VISITOR_PAGE_SIZE_OPTIONS, type VisitorPageSize } from "@/lib/config";
import { useIsKbBuildFlow } from "./kb/KbDatasourceModeContext";
import {
  useKbLinksState,
  useKbFilesState,
  useKbTextState,
  useKbQnAState,
  useKbAgentId,
  useKbDatasourceActions,
} from "./kb/useKbDatasourceState";

interface AgentLinksListProps {
  isLoadingLinks: boolean;
  readOnly?: boolean;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  pageSize: VisitorPageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: VisitorPageSize) => void;
  onRefresh: () => Promise<boolean | void>;
  /** When true, paginate the full in-memory list (agent build flow). */
  localPagination?: boolean;
}

export default function AgentLinksList({
  isLoadingLinks,
  readOnly = false,
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  localPagination = false,
}: AgentLinksListProps) {
  const isBuild = useIsKbBuildFlow();
  const kbActions = useKbDatasourceActions();
  const dispatch = useDispatch();
  const knowledgeBaseLinks = useKbLinksState();
  const knowledgeBaseFiles = useKbFilesState();
  const knowledgeBaseText = useKbTextState();
  const knowledgeBaseQnA = useKbQnAState();
  const agentID = useKbAgentId();
  const triggerFetchAgentUrls = useAppSelector(
    (state) => state.agent.triggerFetchAgentUrls,
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [reindexDialogOpen, setReindexDialogOpen] = useState(false);
  const [singleReindexDialogOpen, setSingleReindexDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);
  const [linkToReindex, setLinkToReindex] = useState<string | null>(null);
  const [manualLinkDialogOpen, setManualLinkDialogOpen] = useState(false);
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [manualLink, setManualLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reindexingLink, setReindexingLink] = useState<string | null>(null);
  const [deletingLink, setDeletingLink] = useState<string | null>(null);
  const [searchPage, setSearchPage] = useState(1);

  const actionButtonClassName =
    "text-[12px] font-semibold flex items-center justify-center gap-2 min-h-[41px] h-[41px] px-[16px]";

  const isSearchActive = Boolean(searchTerm.trim());

  const filteredLinks = useMemo(() => {
    if (!searchTerm.trim()) {
      return knowledgeBaseLinks;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return knowledgeBaseLinks.filter((item) =>
      item.link.toLowerCase().includes(lowerSearchTerm),
    );
  }, [knowledgeBaseLinks, searchTerm]);

  const searchPagination = useMemo(
    () => paginateItems(filteredLinks, searchPage, pageSize),
    [filteredLinks, searchPage, pageSize],
  );

  const listPagination = useMemo(
    () => paginateItems(filteredLinks, currentPage, pageSize),
    [filteredLinks, currentPage, pageSize],
  );

  const currentLinks = isSearchActive
    ? searchPagination.pageItems
    : localPagination
      ? listPagination.pageItems
      : filteredLinks;

  const displayPagination = isSearchActive
    ? {
        currentPage: searchPagination.totalPages > 0 ? searchPage : 1,
        totalPages: searchPagination.totalPages,
        hasNext: searchPagination.hasNext,
        hasPrev: searchPagination.hasPrev,
        total: searchPagination.total,
      }
    : localPagination
      ? {
          currentPage: listPagination.totalPages > 0 ? currentPage : 1,
          totalPages: listPagination.totalPages,
          hasNext: listPagination.hasNext,
          hasPrev: listPagination.hasPrev,
          total: listPagination.total,
        }
      : {
        currentPage: totalPages > 0 ? currentPage : 1,
        totalPages,
        hasNext,
        hasPrev,
        total,
      };

  const handlePageChange = (page: number) => {
    if (isSearchActive) {
      setSearchPage(page);
    } else {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (size: VisitorPageSize) => {
    setSearchPage(1);
    onPageSizeChange(size);
  };

  useEffect(() => {
    setSearchPage(1);
  }, [searchTerm]);

  const displayStatus = (item: KnowledgeBaseLink) =>
    getLinkAgentKbDisplayStatus(item);

  const handleBulkLinksAdded = async (newUrls: string[]) => {
    const uniqueNew = newUrls.filter(
      (url) => !isOnAgentListByUrl(knowledgeBaseLinks, url),
    );
    if (uniqueNew.length === 0) {
      toast.info("All extracted links are already on this agent");
      return;
    }

    try {
      const { rows, libraryCount, newCount } =
        await resolveLinksForAgentAdd(uniqueNew);
      kbActions.setKnowledgeBaseLinks([...rows, ...knowledgeBaseLinks]);

      if (libraryCount > 0 && newCount > 0) {
        toast.info(
          `${libraryCount} link${libraryCount === 1 ? "" : "s"} from team library (attach only), ${newCount} new (will index on save).`,
        );
      } else if (libraryCount > 0) {
        toast.info(
          `${libraryCount} link${libraryCount === 1 ? "" : "s"} found in team library- will attach without re-indexing.`,
        );
      }
    } catch (error: unknown) {
      toast.error(
        extractApiErrorMessage(error, "Failed to check team library for links"),
      );
    }
  };

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
  }, [currentLinks]);

  // Calculate if all links are checked
  const allChecked = useMemo(() => {
    if (knowledgeBaseLinks.length === 0) return false;
    return knowledgeBaseLinks.every((item) => item.checked);
  }, [knowledgeBaseLinks]);

  // Calculate if at least one is unchecked
  const hasUnchecked = useMemo(() => {
    return knowledgeBaseLinks.some((item) => !item.checked);
  }, [knowledgeBaseLinks]);

  // Calculate if any links are checked (for showing Clear Selected)
  const hasChecked = useMemo(() => {
    return knowledgeBaseLinks.some((item) => item.checked);
  }, [knowledgeBaseLinks]);

  // Count checked links
  const checkedLinksCount = useMemo(() => {
    return knowledgeBaseLinks.filter((item) => item.checked).length;
  }, [knowledgeBaseLinks]);

  // Check if any saved attachments are checked (for showing Reindex Selected)
  const hasExistingChecked = useMemo(() => {
    return knowledgeBaseLinks.some(
      (item) => item.checked && item.kb_id && item.status === "existing",
    );
  }, [knowledgeBaseLinks]);

  const checkedExistingLinksCount = useMemo(() => {
    return knowledgeBaseLinks.filter(
      (item) => item.checked && item.kb_id && item.status === "existing",
    ).length;
  }, [knowledgeBaseLinks]);

  const handleRemoveLink = (linkToRemove: string, isPersisted: boolean) => {
    if (isBuild || !isPersisted) {
      kbActions.removeKnowledgeBaseLink(linkToRemove);
      return;
    }
    setLinkToDelete(linkToRemove);
    setDeleteDialogOpen(true);
  };

  const buildCurrentKbState = () => ({
    knowledgeBaseLinks,
    knowledgeBaseFiles,
    knowledgeBaseText,
    knowledgeBaseQnA,
  });

  const pendingCount = useMemo(
    () =>
      knowledgeBaseLinks.filter(
        (l) => l.status === "new" || l.status === "pending_attach",
      ).length,
    [knowledgeBaseLinks],
  );

  const syncLinksFromResponse = async () => {
    await onRefresh();
  };

  const detachLinksByKbIds = async (kbIds: string[]) => {
    if (isBuild) {
      const remainingLinks = knowledgeBaseLinks.filter(
        (item) => !item.kb_id || !kbIds.includes(item.kb_id),
      );
      kbActions.setKnowledgeBaseLinks(remainingLinks);
      return { success: true };
    }

    if (!agentID) {
      toast.error("Agent ID not found");
      return;
    }

    NProgress.start();

    try {
      const remainingLinks = knowledgeBaseLinks.filter(
        (item) => !item.kb_id || !kbIds.includes(item.kb_id),
      );
      const kb_attachments = buildKbAttachmentsFromState({
        ...buildCurrentKbState(),
        knowledgeBaseLinks: remainingLinks,
      });

      const response = await updateAgentKb(agentID, { kb_attachments });
      if (response.success) {
        toast.success(response.message || "Link detached from agent");
        await syncLinksFromResponse();
        NProgress.done();
        return response;
      }

      toast.error(response.message || "Failed to detach link");
      NProgress.done();
      throw new Error(response.message || "Failed to detach link");
    } catch (error: unknown) {
      toast.error(extractApiErrorMessage(error, "Failed to detach link"));
      NProgress.done();
      throw error;
    }
  };

  const handleConfirmDeleteLink = async () => {
    if (!linkToDelete) return;

    setDeleteDialogOpen(false);
    setDeletingLink(linkToDelete);
    try {
      const target = knowledgeBaseLinks.find(
        (item) => item.link === linkToDelete,
      );
      if (target?.kb_id && !isBuild) {
        await detachLinksByKbIds([target.kb_id]);
      } else {
        kbActions.removeKnowledgeBaseLink(linkToDelete);
      }
    } catch {
      // toast shown in detachLinksByKbIds
    } finally {
      setDeletingLink(null);
      setLinkToDelete(null);
    }
  };

  const handleToggleCheckbox = (index: number) => {
    kbActions.toggleKnowledgeBaseLink(index);
  };

  const handleToggleAll = () => {
    kbActions.toggleAllKnowledgeBaseLinks(!allChecked);
  };

  const handleClearSelected = () => {
    setClearDialogOpen(true);
  };

  const handleConfirmClearSelected = async () => {
    const checkedLinks = knowledgeBaseLinks.filter((item) => item.checked);
    const persistedKbIds = checkedLinks
      .filter(
        (item) =>
          item.kb_id &&
          (item.status === "existing" || item.status === "pending_attach"),
      )
      .map((item) => item.kb_id as string);

    setClearDialogOpen(false);

    try {
      if (!isBuild && persistedKbIds.length > 0) {
        await detachLinksByKbIds(persistedKbIds);
      }

      const uncheckedLinks = knowledgeBaseLinks.filter((item) => !item.checked);
      kbActions.setKnowledgeBaseLinks(uncheckedLinks);
    } catch {
      // toast shown in detachLinksByKbIds
    }
  };

  const handleReindexSelected = () => {
    setReindexDialogOpen(true);
  };

  const handleConfirmReindexSelected = async () => {
    const kbIds = knowledgeBaseLinks
      .filter(
        (item) => item.checked && item.kb_id && item.status === "existing",
      )
      .map((item) => item.kb_id)
      .filter((kbId): kbId is string => Boolean(kbId));

    setReindexDialogOpen(false);

    try {
      await reindexLinksByKbIds(kbIds);
    } catch {
      // toast shown in reindexLinksByKbIds
    }
  };

  const reindexLinksByKbIds = async (kbIds: string[]) => {
    if (kbIds.length === 0) {
      toast.error("No indexed team links selected");
      return;
    }

    NProgress.start();
    try {
      await Promise.all(kbIds.map((kbId) => reindexKbItem(kbId, "url")));
      toast.success("Re-indexing started for selected links");
      dispatch(setTriggerFetchAgentUrls(triggerFetchAgentUrls + 1));
      NProgress.done();
    } catch (error: unknown) {
      toast.error(extractApiErrorMessage(error, "Failed to reindex links"));
      NProgress.done();
      throw error;
    }
  };

  const handleReindexLink = (link: string) => {
    setLinkToReindex(link);
    setSingleReindexDialogOpen(true);
  };

  const handleConfirmReindexLink = async () => {
    if (!linkToReindex) return;

    setSingleReindexDialogOpen(false);
    setReindexingLink(linkToReindex);
    try {
      const target = knowledgeBaseLinks.find(
        (item) => item.link === linkToReindex,
      );
      if (target?.kb_id) {
        await reindexLinksByKbIds([target.kb_id]);
      }
    } catch {
      // toast shown in reindexLinksByKbIds
    } finally {
      setReindexingLink(null);
      setLinkToReindex(null);
    }
  };

  const handleAddManualLink = async () => {
    if (manualLink.trim()) {
      setIsLoading(true);
      try {
        const pingResponse = await pingUrl(manualLink.trim());

        if (pingResponse.success && pingResponse.data.reachable) {
          const normalizedUrl = pingResponse.data.normalized_url;

          if (isOnAgentListByUrl(knowledgeBaseLinks, normalizedUrl)) {
            toast.error("This link is already on this agent.");
            return;
          }

          const { row, reusedFromLibrary } =
            await resolveLinkForAgentAdd(normalizedUrl);
          kbActions.setKnowledgeBaseLinks([row, ...knowledgeBaseLinks]);
          setManualLink("");
          setManualLinkDialogOpen(false);

          if (reusedFromLibrary) {
            toast.info(LIBRARY_REUSE_TOAST.link);
          } else {
            toast.success("Link added- will be indexed when you save.");
          }
        } else {
          toast.error(
            "URL is not reachable. Please check the URL and try again.",
          );
        }
      } catch (error: unknown) {
        toast.error(
          extractApiErrorMessage(
            error,
            "Failed to validate URL. Please try again.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Please enter a valid link");
    }
  };

  const handleAttachFromLibrary = (items: AgentKbLibraryPick[]) => {
    const existingKbIds = new Set(
      knowledgeBaseLinks.map((item) => item.kb_id).filter(Boolean),
    );
    const existingUrls = new Set(knowledgeBaseLinks.map((item) => item.link));

    const newRows: KnowledgeBaseLink[] = items
      .filter(
        (item) =>
          !existingKbIds.has(item.kb_id) && !existingUrls.has(item.label),
      )
      .map((item) => ({
        kb_id: item.kb_id,
        link: item.label,
        checked: true,
        status: "pending_attach",
        updated_at: null,
        api_status: "ready",
      }));

    if (newRows.length === 0) {
      toast.info("Selected links are already attached or pending");
      return;
    }

    kbActions.setKnowledgeBaseLinks([...newRows, ...knowledgeBaseLinks]);
    toast.success(
      isBuild
        ? `${newRows.length} team link${newRows.length === 1 ? "" : "s"} added from library`
        : `${newRows.length} team link${newRows.length === 1 ? "" : "s"} added from library- save to attach`,
    );
  };

  // Function to highlight matching text in search results
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

  const linkColumnCount = readOnly ? 3 : 4;
  const emptyLinksMessage = searchTerm.trim()
    ? `No links found matching "${searchTerm}"`
    : isBuild
      ? "No links added yet"
      : "No links found";

  return (
    <>
      <div className="flex flex-col">
        <div
          className={`flex items-center gap-3 mb-5 flex-wrap ${
            readOnly ? "justify-end" : "justify-between"
          }`}
        >
          {!readOnly && (
            <div className="flex items-center gap-2 flex-wrap">
              <TeamKbAddWebsiteDialog
                existingUrls={knowledgeBaseLinks.map((item) => item.link)}
                onLinksAdded={handleBulkLinksAdded}
                triggerClassName={actionButtonClassName}
              />
              <TeamKbAddSitemapDialog
                existingUrls={knowledgeBaseLinks.map((item) => item.link)}
                onLinksAdded={handleBulkLinksAdded}
                triggerClassName={actionButtonClassName}
              />
              <PrimaryButton
                className={`${actionButtonClassName} !py-0`}
                onClick={() => setLibraryDialogOpen(true)}
              >
                <BookOpen className="mr-0 md:mr-1" size={14} />
                Library
              </PrimaryButton>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {!readOnly && (
              <OutlineButton
                className={`${actionButtonClassName} !py-0 border-[2px] shrink-0`}
                onClick={() => setManualLinkDialogOpen(true)}
              >
                <span className="text-[16px] leading-none">+</span>
                <span className="hidden md:inline">Add More</span>
              </OutlineButton>
            )}
            <div className="relative w-[200px] h-[41px] shrink-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <CustomInput
                type="text"
                placeholder="Search links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[41px] min-h-[41px] pl-9 pr-3 text-[12px]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3 px-[10px] flex-wrap gap-2">
          {!readOnly && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="master-checkbox"
                  checked={allChecked}
                  onCheckedChange={handleToggleAll}
                  className="border-2 border-gray-300 dark:border-gray-500 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                />
                <label
                  htmlFor="master-checkbox"
                  className="text-[12px] font-semibold text-deep-onyx dark:text-pure-mist cursor-pointer min-w-[70px]"
                >
                  {hasUnchecked ? "Select All" : "Unselect All"}
                </label>
              </div>
              {hasChecked && (
                <>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                  {hasExistingChecked && (
                    <>
                      <Dialog
                        open={reindexDialogOpen}
                        onOpenChange={setReindexDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <button className="flex items-center gap-1.5 text-[12px] font-semibold text-serene-purple hover:underline cursor-pointer">
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">
                              Reindex Selected
                            </span>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Reindex Selected Links</DialogTitle>
                            <DialogDescription>
                              This will reindex {checkedExistingLinksCount}{" "}
                              {checkedExistingLinksCount === 1
                                ? "link"
                                : "links"}{" "}
                              in your knowledge base.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <PrimaryButton className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx">
                                Cancel
                              </PrimaryButton>
                            </DialogClose>
                            <PrimaryButton
                              className="text-[12px] font-semibold bg-serene-purple hover:bg-serene-purple/90"
                              onClick={handleConfirmReindexSelected}
                            >
                              Confirm
                            </PrimaryButton>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                    </>
                  )}
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
                        <DialogTitle>Clear Selected Links</DialogTitle>
                        <DialogDescription>
                          This will remove {checkedLinksCount}{" "}
                          {checkedLinksCount === 1 ? "link" : "links"} from this
                          agent. Library items will remain available for other
                          agents.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <PrimaryButton className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx">
                            Cancel
                          </PrimaryButton>
                        </DialogClose>
                        <PrimaryButton
                          className="text-[12px] font-semibold bg-danger-red hover:bg-danger-red/90"
                          onClick={handleConfirmClearSelected}
                        >
                          Confirm
                        </PrimaryButton>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          )}
          {/* Delete Link Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Delete Link</DialogTitle>
                <DialogDescription>
                  This will detach this link from the agent. The library item
                  will not be deleted.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <PrimaryButton className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx">
                    Cancel
                  </PrimaryButton>
                </DialogClose>
                <PrimaryButton
                  className="text-[12px] font-semibold bg-danger-red hover:bg-danger-red/90"
                  onClick={handleConfirmDeleteLink}
                >
                  Delete
                </PrimaryButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Single Link Reindex Dialog */}
          <Dialog
            open={singleReindexDialogOpen}
            onOpenChange={setSingleReindexDialogOpen}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Reindex Link</DialogTitle>
                <DialogDescription>
                  This will reindex this link in your knowledge base. The agent
                  will re-crawl and re-index the content from this URL.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <PrimaryButton className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx">
                    Cancel
                  </PrimaryButton>
                </DialogClose>
                <PrimaryButton
                  className="text-[12px] font-semibold bg-serene-purple hover:bg-serene-purple/90"
                  onClick={handleConfirmReindexLink}
                >
                  Confirm
                </PrimaryButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Manual Link Dialog */}
          <Dialog
            open={manualLinkDialogOpen}
            onOpenChange={setManualLinkDialogOpen}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Manual Link</DialogTitle>
                <DialogDescription>
                  Add a single link to your knowledge base manually.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-[4px] py-4">
                <p className="font-bold text-[13px]">Link URL</p>
                <div className="grid gap-3">
                  <CustomInput
                    type="url"
                    placeholder="Enter link URL (e.g., https://example.com/page)"
                    value={manualLink}
                    onChange={(e) => setManualLink(e.target.value)}
                    className="w-full px-[12px] py-[10px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <OutlineButton className="text-[12px]">Back</OutlineButton>
                </DialogClose>
                <PrimaryButton
                  className="min-w-[80px] text-[12px] font-semibold flex items-center justify-center gap-2"
                  onClick={handleAddManualLink}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner className="border-white dark:border-deep-onyx" />
                  ) : (
                    <span>Add</span>
                  )}
                </PrimaryButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

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
                  <col className="w-[100px]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {!readOnly && (
                      <TableHead className="font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap" />
                    )}
                    <TableHead className="font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                      URL
                    </TableHead>
                    <TableHead className="font-[600] py-3 pl-8 md:pl-12 pr-[10px] text-[14px] whitespace-nowrap">
                      Updated at
                    </TableHead>
                    <TableHead className="text-right font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLinks && currentLinks.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={linkColumnCount}
                        className="py-10 text-center"
                      >
                        <Spinner className="border-serene-purple dark:border-pure-mist mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : currentLinks.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={linkColumnCount}
                        className="py-10 text-center text-[12px] text-gray-500 dark:text-gray-400"
                      >
                        {emptyLinksMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentLinks.map((item) => {
                      const originalIndex = knowledgeBaseLinks.findIndex(
                        (linkItem) => linkItem.link === item.link,
                      );
                      return (
                        <TableRow
                          key={item.link}
                          onClick={() => {
                            if (!readOnly) handleToggleCheckbox(originalIndex);
                          }}
                          className={`border-b border-gray-100 dark:border-deep-onyx transition-all duration-200 ${
                            readOnly
                              ? ""
                              : "cursor-pointer hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20"
                          }`}
                        >
                          {!readOnly && (
                            <TableCell className="py-4 px-[10px] whitespace-nowrap">
                              <Checkbox
                                id={`link-${originalIndex}`}
                                checked={item.checked}
                                onCheckedChange={() =>
                                  handleToggleCheckbox(originalIndex)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="border-2 border-gray-300 dark:border-gray-500 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium py-4 px-[10px] text-[14px] text-deep-onyx dark:text-pure-mist overflow-hidden">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="font-mono text-[12px] truncate block min-w-0">
                                    {highlightMatch(item.link, searchTerm)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs break-all">
                                    {item.link}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                              <KbStatusBadge status={displayStatus(item)} />
                            </div>
                          </TableCell>
                          <TableCell className="py-4 pl-8 md:pl-12 pr-[10px] text-[14px] whitespace-nowrap text-gray-500 dark:text-gray-400">
                            {item.updated_at
                              ? formatDateTime12hr(item.updated_at)
                              : "—"}
                          </TableCell>
                          <TableCell className="w-[100px] text-right py-4 px-[10px] whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {!readOnly &&
                                item.kb_id &&
                                item.status !== "pending_attach" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReindexLink(item.link);
                                        }}
                                        disabled={reindexingLink === item.link}
                                        className="p-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Reindex link"
                                      >
                                        {reindexingLink === item.link ? (
                                          <Spinner className="h-3.5 w-3.5 border-serene-purple dark:border-pure-mist" />
                                        ) : (
                                          <RotateCcw className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 hover:text-serene-purple transition-colors" />
                                        )}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Reindex this link</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              {!readOnly && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveLink(
                                          item.link,
                                          item.status === "existing" &&
                                            Boolean(item.kb_id),
                                        );
                                      }}
                                      disabled={deletingLink === item.link}
                                      className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                      aria-label="Remove link"
                                    >
                                      {deletingLink === item.link ? (
                                        <Spinner className="h-3.5 w-3.5 border-danger-red dark:border-danger-red" />
                                      ) : item.status === "existing" ? (
                                        <Trash className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 hover:text-danger-red transition-colors" />
                                      ) : (
                                        <X className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 hover:text-danger-red transition-colors" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {item.status === "existing"
                                        ? "Delete this link"
                                        : "Remove this link"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Link
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {showRightGradient && currentLinks.length > 0 && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
          )}
        </div>

        <TablePaginationControls
          currentPage={displayPagination.currentPage}
          totalPages={displayPagination.totalPages}
          hasNext={displayPagination.hasNext}
          hasPrev={displayPagination.hasPrev}
          total={displayPagination.total}
          totalRecords={
            isSearchActive || localPagination || isBuild
              ? displayPagination.total
              : displayPagination.total + pendingCount
          }
          pageSize={pageSize}
          pageSizeOptions={VISITOR_PAGE_SIZE_OPTIONS}
          isLoading={isLoadingLinks}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          className="mt-3 mb-4"
        />
      </div>
      <AgentKbPickFromLibraryDialog
        open={libraryDialogOpen}
        onOpenChange={setLibraryDialogOpen}
        sourceType="url"
        excludeKbIds={knowledgeBaseLinks
          .map((item) => item.kb_id)
          .filter((kbId): kbId is string => Boolean(kbId))}
        onConfirm={handleAttachFromLibrary}
      />
    </>
  );
}
