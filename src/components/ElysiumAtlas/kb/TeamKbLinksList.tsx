"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  Search,
  ExternalLink,
  Trash2,
  Trash,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import NProgress from "nprogress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePaginationControls from "../TablePaginationControls";
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
import CustomInput from "@/components/inputs/CustomInput";
import OutlineButton from "@/components/ui/OutlineButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import KbStatusBadge from "./KbStatusBadge";
import KbSearchingTableRow from "./KbSearchingTableRow";
import TeamKbAddWebsiteDialog from "./TeamKbAddWebsiteDialog";
import TeamKbAddSitemapDialog from "./TeamKbAddSitemapDialog";
import type { TeamKbLinkRow } from "./TeamKbLinks";
import { type VisitorPageSize } from "@/lib/config";
import { formatDateTime12hr } from "@/utils/formatDate";
import { isKbSearchInProgress } from "@/utils/kbSearchUi";
import {
  deleteUrl,
  reindexItem,
  pingUrl,
} from "@/utils/kbItemsApi";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";

interface TeamKbLinksListProps {
  links: TeamKbLinkRow[];
  onLinksChange: (links: TeamKbLinkRow[]) => void;
  onBulkLinksAdded: (urls: string[]) => void;
  searchQuery: string;
  debouncedSearchQuery: string;
  onSearchChange: (query: string) => void;
  isSearchActive?: boolean;
  isLoadingLinks: boolean;
  readOnly?: boolean;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: VisitorPageSize) => void;
  onRefresh: () => void;
}

export default function TeamKbLinksList({
  links,
  onLinksChange,
  onBulkLinksAdded,
  searchQuery,
  debouncedSearchQuery,
  onSearchChange,
  isSearchActive = false,
  isLoadingLinks,
  readOnly = false,
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  total,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  onRefresh,
}: TeamKbLinksListProps) {
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [reindexDialogOpen, setReindexDialogOpen] = useState(false);
  const [singleReindexDialogOpen, setSingleReindexDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<TeamKbLinkRow | null>(null);
  const [linkToReindex, setLinkToReindex] = useState<TeamKbLinkRow | null>(
    null,
  );
  const [manualLinkDialogOpen, setManualLinkDialogOpen] = useState(false);
  const [manualLink, setManualLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reindexingUrl, setReindexingUrl] = useState<string | null>(null);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  const isSearching = isKbSearchInProgress(
    searchQuery,
    debouncedSearchQuery,
    isLoadingLinks,
  );
  const displayLinks = isSearching ? [] : links;

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
  }, [displayLinks]);

  const allChecked = useMemo(() => {
    if (links.length === 0) return false;
    return links.every((item) => item.checked);
  }, [links]);

  const hasUnchecked = useMemo(() => {
    return links.some((item) => !item.checked);
  }, [links]);

  const hasChecked = useMemo(() => {
    return links.some((item) => item.checked);
  }, [links]);

  const checkedLinksCount = useMemo(() => {
    return links.filter((item) => item.checked).length;
  }, [links]);

  const hasExistingChecked = useMemo(() => {
    return links.some(
      (item) => item.checked && item.status === "existing",
    );
  }, [links]);

  const pendingCount = useMemo(
    () => links.filter((l) => l.status === "new").length,
    [links],
  );

  const updateLinkAt = (index: number, updater: (item: TeamKbLinkRow) => TeamKbLinkRow) => {
    onLinksChange(
      links.map((item, i) => (i === index ? updater(item) : item)),
    );
  };

  const handleToggleCheckbox = (index: number) => {
    updateLinkAt(index, (item) => ({ ...item, checked: !item.checked }));
  };

  const handleToggleAll = () => {
    onLinksChange(links.map((item) => ({ ...item, checked: !allChecked })));
  };

  const handleRemoveLink = (item: TeamKbLinkRow) => {
    if (item.status === "existing" && item.kb_id) {
      setLinkToDelete(item);
      setDeleteDialogOpen(true);
    } else {
      onLinksChange(links.filter((l) => l.url !== item.url));
    }
  };

  const handleConfirmDeleteLink = async () => {
    if (!linkToDelete?.kb_id) return;

    const kbId = linkToDelete.kb_id;
    const url = linkToDelete.url;
    setDeleteDialogOpen(false);
    setDeletingUrl(url);
    NProgress.start();

    try {
      const response = await deleteUrl(kbId);
      if (response.success) {
        toast.success(response.message || "Link deleted successfully");
        onLinksChange(links.filter((l) => l.url !== url));
        onRefresh();
      } else {
        toast.error(response.message || "Failed to delete link");
      }
    } catch (error: unknown) {
      toast.error(extractApiErrorMessage(error, "Failed to delete link"));
    } finally {
      setDeletingUrl(null);
      setLinkToDelete(null);
      NProgress.done();
    }
  };

  const handleConfirmClearSelected = async () => {
    const checkedLinks = links.filter((item) => item.checked);
    const existingToDelete = checkedLinks.filter(
      (item) => item.status === "existing" && item.kb_id,
    );

    setClearDialogOpen(false);
    NProgress.start();

    try {
      for (const item of existingToDelete) {
        if (!item.kb_id) continue;
        const response = await deleteUrl(item.kb_id);
        if (!response.success) {
          throw new Error(response.message || "Failed to delete link");
        }
      }

      if (existingToDelete.length > 0) {
        toast.success(
          `Successfully removed ${checkedLinks.length} ${
            checkedLinks.length === 1 ? "link" : "links"
          }`,
        );
      }

      onLinksChange(links.filter((item) => !item.checked));
      if (existingToDelete.length > 0) {
        onRefresh();
      }
    } catch (error: unknown) {
      toast.error(
        extractApiErrorMessage(error, "Failed to remove selected links"),
      );
    } finally {
      NProgress.done();
    }
  };

  const reindexLinks = async (items: TeamKbLinkRow[]) => {
    const withKbId = items.filter((item) => item.kb_id);
    if (withKbId.length === 0) {
      toast.error("No indexed links selected");
      return;
    }

    NProgress.start();
    try {
      for (const item of withKbId) {
        const response = await reindexItem(item.kb_id!, "url");
        if (!response.success) {
          throw new Error(response.message || "Failed to reindex link");
        }
      }
      toast.success(
        responseMessage(withKbId.length, "Re-indexing started for"),
      );
      onRefresh();
    } catch (error: unknown) {
      toast.error(extractApiErrorMessage(error, "Failed to reindex links"));
      throw error;
    } finally {
      NProgress.done();
    }
  };

  const responseMessage = (count: number, prefix: string) =>
    `${prefix} ${count} ${count === 1 ? "link" : "links"}.`;

  const handleConfirmReindexSelected = async () => {
    const checkedExisting = links.filter(
      (item) => item.checked && item.status === "existing",
    );
    setReindexDialogOpen(false);
    try {
      await reindexLinks(checkedExisting);
    } catch {
      // Error toast shown in reindexLinks
    }
  };

  const handleReindexLink = (item: TeamKbLinkRow) => {
    setLinkToReindex(item);
    setSingleReindexDialogOpen(true);
  };

  const handleConfirmReindexLink = async () => {
    if (!linkToReindex) return;

    const item = linkToReindex;
    setSingleReindexDialogOpen(false);
    setReindexingUrl(item.url);
    try {
      await reindexLinks([item]);
    } catch {
      // Error toast shown in reindexLinks
    } finally {
      setReindexingUrl(null);
      setLinkToReindex(null);
    }
  };

  const handleAddManualLink = async () => {
    if (!manualLink.trim()) {
      toast.error("Please enter a valid link");
      return;
    }

    setIsLoading(true);
    try {
      const pingResponse = await pingUrl(manualLink.trim());

      if (pingResponse.success && pingResponse.data?.reachable) {
        const normalizedUrl = pingResponse.data.normalized_url as string;
        const exists = links.some((item) => item.url === normalizedUrl);

        if (!exists) {
          const newLink: TeamKbLinkRow = {
            url: normalizedUrl,
            checked: true,
            status: "new",
            updated_at: null,
          };
          onLinksChange([newLink, ...links]);
          setManualLink("");
          setManualLinkDialogOpen(false);
          toast.success("Link added successfully");
        } else {
          toast.error("Link already exists in the list.");
        }
      } else {
        toast.error(
          "URL is not reachable. Please check the URL and try again.",
        );
      }
    } catch (error: unknown) {
      toast.error(
        extractApiErrorMessage(error, "Failed to validate URL. Please try again."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const highlightMatch = (text: string, term: string) => {
    if (!term.trim()) return text;

    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);

    if (index === -1) return text;

    const beforeMatch = text.substring(0, index);
    const match = text.substring(index, index + term.length);
    const afterMatch = text.substring(index + term.length);

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
  const emptyLinksMessage = isSearchActive
    ? `No links found matching "${debouncedSearchQuery}"`
    : "No links found";

  const actionButtonClassName =
    "text-[12px] font-semibold flex items-center justify-center gap-2 min-h-[41px] h-[41px] px-[16px]";

  const displayStatus = (item: TeamKbLinkRow) => {
    if (item.status === "new") return "new" as const;
    return item.api_status ?? "draft";
  };

  return (
    <div className="flex flex-col">
      <div
        className={`flex items-center gap-3 mb-5 flex-wrap ${
          readOnly ? "justify-end" : "justify-between"
        }`}
      >
        {!readOnly && (
          <div className="flex items-center gap-2">
            <TeamKbAddWebsiteDialog
              existingUrls={links.map((item) => item.url)}
              onLinksAdded={onBulkLinksAdded}
              triggerClassName={actionButtonClassName}
            />
            <TeamKbAddSitemapDialog
              existingUrls={links.map((item) => item.url)}
              onLinksAdded={onBulkLinksAdded}
              triggerClassName={actionButtonClassName}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {!readOnly && (
            <OutlineButton
              className={`${actionButtonClassName} !py-0 border-[2px]`}
              onClick={() => setManualLinkDialogOpen(true)}
            >
              <span className="text-[16px] leading-none">+</span>
              <span className="hidden md:inline">Add More</span>
            </OutlineButton>
          )}
          <div className="relative w-[200px] h-[41px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <CustomInput
              type="text"
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
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
                id="team-kb-master-checkbox"
                checked={allChecked}
                onCheckedChange={handleToggleAll}
                className="border-2 border-gray-300 dark:border-gray-500 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white dark:data-[state=checked]:text-black"
              />
              <label
                htmlFor="team-kb-master-checkbox"
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
                            This will reindex {checkedLinksCount}{" "}
                            {checkedLinksCount === 1 ? "link" : "links"} in your
                            knowledge base.
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
                <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
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
                        {checkedLinksCount === 1 ? "link" : "links"} from your
                        knowledge base. This action cannot be undone.
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

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Link</DialogTitle>
              <DialogDescription>
                This will permanently delete this link from your team knowledge
                base. This action cannot be undone.
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

        <Dialog
          open={singleReindexDialogOpen}
          onOpenChange={setSingleReindexDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Reindex Link</DialogTitle>
              <DialogDescription>
                This will reindex this link in your knowledge base. The system
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
                {isSearching ? (
                  <KbSearchingTableRow
                    colSpan={linkColumnCount}
                    query={searchQuery.trim()}
                  />
                ) : isLoadingLinks && displayLinks.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={linkColumnCount}
                      className="py-10 text-center"
                    >
                      <Spinner className="border-serene-purple dark:border-pure-mist mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : displayLinks.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={linkColumnCount}
                      className="py-10 text-center text-[12px] text-gray-500 dark:text-gray-400"
                    >
                      {emptyLinksMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayLinks.map((item) => {
                    const originalIndex = links.findIndex(
                      (linkItem) => linkItem.url === item.url,
                    );
                    return (
                      <TableRow
                        key={item.url}
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
                              id={`team-kb-link-${originalIndex}`}
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
                                  {highlightMatch(item.url, debouncedSearchQuery)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs break-all">{item.url}</p>
                              </TooltipContent>
                            </Tooltip>
                            <KbStatusBadge
                              status={displayStatus(item)}
                              mode="team"
                            />
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
                              item.status === "existing" &&
                              item.kb_id && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReindexLink(item);
                                      }}
                                      disabled={reindexingUrl === item.url}
                                      className="p-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                      aria-label="Reindex link"
                                    >
                                      {reindexingUrl === item.url ? (
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
                                      handleRemoveLink(item);
                                    }}
                                    disabled={deletingUrl === item.url}
                                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Remove link"
                                  >
                                    {deletingUrl === item.url ? (
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
                              href={item.url}
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
        {showRightGradient && displayLinks.length > 0 && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
        )}
      </div>

      <TablePaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrev={hasPrev}
        total={total}
        totalRecords={isSearchActive ? total : total + pendingCount}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        isLoading={isLoadingLinks}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        className="mt-3 mb-4"
      />
    </div>
  );
}
