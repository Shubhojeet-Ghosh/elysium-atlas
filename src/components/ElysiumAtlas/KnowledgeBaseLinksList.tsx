"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { X, Search, ExternalLink, Trash2, BookOpen } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/store/reducers/agentBuilderSlice";
import { KnowledgeBaseLink } from "@/store/types/AgentBuilderTypes";
import CustomInput from "@/components/inputs/CustomInput";
import { toast } from "sonner";
import OutlineButton from "@/components/ui/OutlineButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import fastApiAxios from "@/utils/fastapi_axios";
import TablePaginationControls from "./TablePaginationControls";
import { useClientSideTablePagination } from "@/hooks/useClientSideTablePagination";
import AgentKbPickFromLibraryDialog, {
  type AgentKbLibraryPick,
} from "./kb/AgentKbPickFromLibraryDialog";
import KbStatusBadge from "./kb/KbStatusBadge";
import { getLinkAgentKbDisplayStatus } from "@/utils/agentKbUtils";
import { resolveLinkForAgentAdd } from "@/utils/teamKbLookup";

export default function KnowledgeBaseLinksList() {
  const dispatch = useDispatch();
  const knowledgeBaseLinks = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseLinks,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [manualLinkDialogOpen, setManualLinkDialogOpen] = useState(false);
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [manualLink, setManualLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredLinks = useMemo(() => {
    if (!searchTerm.trim()) return knowledgeBaseLinks;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return knowledgeBaseLinks.filter((item) =>
      item.link.toLowerCase().includes(lowerSearchTerm),
    );
  }, [knowledgeBaseLinks, searchTerm]);

  const {
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    total,
    pageSize,
    pageSizeOptions,
    paginatedItems: currentLinks,
    handlePageChange,
    handlePageSizeChange,
    resetPage,
  } = useClientSideTablePagination(filteredLinks);

  useEffect(() => {
    resetPage();
  }, [searchTerm, resetPage]);

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

  const allChecked = useMemo(() => {
    if (knowledgeBaseLinks.length === 0) return false;
    return knowledgeBaseLinks.every((item) => item.checked);
  }, [knowledgeBaseLinks]);

  const hasUnchecked = useMemo(
    () => knowledgeBaseLinks.some((item) => !item.checked),
    [knowledgeBaseLinks],
  );

  const hasChecked = useMemo(
    () => knowledgeBaseLinks.some((item) => item.checked),
    [knowledgeBaseLinks],
  );

  const checkedLinksCount = useMemo(
    () => knowledgeBaseLinks.filter((item) => item.checked).length,
    [knowledgeBaseLinks],
  );

  const handleRemoveLink = (linkToRemove: string) => {
    dispatch(removeKnowledgeBaseLink(linkToRemove));
  };

  const handleToggleCheckbox = (index: number) => {
    dispatch(toggleKnowledgeBaseLink(index));
  };

  const handleToggleAll = () => {
    dispatch(toggleAllKnowledgeBaseLinks(!allChecked));
  };

  const handleConfirmClearSelected = () => {
    const uncheckedLinks = knowledgeBaseLinks.filter((item) => !item.checked);
    dispatch(setKnowledgeBaseLinks(uncheckedLinks));
    setClearDialogOpen(false);
  };

  const handleAddManualLink = async () => {
    if (!manualLink.trim()) {
      toast.error("Please enter a valid link");
      return;
    }
    setIsLoading(true);
    try {
      const pingResponse = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/v1/ping-url",
        { url: manualLink.trim() },
      );
      if (pingResponse.data.success && pingResponse.data.data.reachable) {
        const normalizedUrl = pingResponse.data.data.normalized_url;
        const exists = knowledgeBaseLinks.some(
          (item) => item.link === normalizedUrl,
        );
        if (!exists) {
          const { row, reusedFromLibrary } =
            await resolveLinkForAgentAdd(normalizedUrl);
          dispatch(setKnowledgeBaseLinks([row, ...knowledgeBaseLinks]));
          setManualLink("");
          setManualLinkDialogOpen(false);
          toast.success(
            reusedFromLibrary
              ? "Link added from team library"
              : "Link added successfully",
          );
        } else {
          toast.error("Link already exists in the list.");
        }
      } else {
        toast.error(
          "URL is not reachable. Please check the URL and try again.",
        );
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to validate URL. Please try again.",
      );
    } finally {
      setIsLoading(false);
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
      toast.info("Selected links are already in your list");
      return;
    }

    dispatch(setKnowledgeBaseLinks([...newRows, ...knowledgeBaseLinks]));
    toast.success(
      `${newRows.length} link${newRows.length === 1 ? "" : "s"} added from library`,
    );
  };

  const highlightMatch = (text: string, term: string) => {
    if (!term.trim()) return text;
    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);
    if (index === -1) return text;
    return (
      <>
        {text.substring(0, index)}
        <span className="bg-serene-purple/80 text-white font-semibold">
          {text.substring(index, index + term.length)}
        </span>
        {text.substring(index + term.length)}
      </>
    );
  };

  const emptyMessage = searchTerm
    ? `No links found matching "${searchTerm}"`
    : "No links added yet";

  return (
    <div className="flex flex-col mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="lg:text-[14px] text-[12px] font-bold text-deep-onyx dark:text-pure-mist">
          Links ({knowledgeBaseLinks.length})
          {searchTerm && (
            <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
              ({filteredLinks.length} found)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <OutlineButton
            className="text-[12px] font-bold px-3 py-1 h-8"
            onClick={() => setLibraryDialogOpen(true)}
          >
            <BookOpen className="mr-0 md:mr-1" size={14} />
            <span className="hidden md:inline">From library</span>
          </OutlineButton>
          <OutlineButton
            className="text-[12px] font-bold px-3 py-1 h-8"
            onClick={() => setManualLinkDialogOpen(true)}
          >
            <span className="text-[18px]">+</span>{" "}
            <span className="hidden md:inline">Add More</span>
          </OutlineButton>
          <div className="relative w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <CustomInput
              type="text"
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-[11px] h-8"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 px-[10px] flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="master-checkbox"
              checked={allChecked}
              onCheckedChange={handleToggleAll}
              disabled={knowledgeBaseLinks.length === 0}
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
              <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-1.5 text-[12px] font-semibold text-danger-red hover:underline cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear Selected
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Clear Selected Links</DialogTitle>
                    <DialogDescription>
                      This will remove {checkedLinksCount}{" "}
                      {checkedLinksCount === 1 ? "link" : "links"} from your
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
              <CustomInput
                type="url"
                placeholder="Enter link URL (e.g., https://example.com/page)"
                value={manualLink}
                onChange={(e) => setManualLink(e.target.value)}
                className="w-full px-[12px] py-[10px]"
              />
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

      <TablePaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrev={hasPrev}
        total={total}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
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
                  <TableHead className="w-[40px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap" />
                  <TableHead className="min-w-[260px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                    URL
                  </TableHead>
                  <TableHead className="min-w-[120px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap text-center">
                    Status
                  </TableHead>
                  <TableHead className="w-[100px] text-right font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentLinks.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-[12px] text-gray-500 dark:text-gray-400"
                    >
                      {emptyMessage}
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
                        onClick={() => handleToggleCheckbox(originalIndex)}
                        className="cursor-pointer border-b border-gray-100 dark:border-deep-onyx hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20 transition-all duration-200"
                      >
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
                        <TableCell className="font-medium py-4 px-[10px] text-[14px] text-deep-onyx dark:text-pure-mist min-w-[260px]">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-mono text-[12px] truncate block max-w-[320px]">
                                {highlightMatch(item.link, searchTerm)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs break-all">{item.link}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="min-w-[120px] py-4 px-[10px] text-center">
                          <div className="flex items-center justify-center">
                            <KbStatusBadge
                              status={getLinkAgentKbDisplayStatus(item)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="w-[100px] text-right py-4 px-[10px] whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveLink(item.link);
                              }}
                              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                              aria-label="Remove link"
                            >
                              <X className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 hover:text-danger-red transition-colors" />
                            </button>
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

      <AgentKbPickFromLibraryDialog
        open={libraryDialogOpen}
        onOpenChange={setLibraryDialogOpen}
        sourceType="url"
        excludeKbIds={knowledgeBaseLinks
          .map((l) => l.kb_id)
          .filter((id): id is string => Boolean(id))}
        onConfirm={handleAttachFromLibrary}
      />
    </div>
  );
}
