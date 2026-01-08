"use client";
import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  Trash2,
} from "lucide-react";
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
} from "@/store/reducers/agentBuilderSlice";
import { KnowledgeBaseLink } from "@/store/types/AgentBuilderTypes";
import CustomInput from "@/components/inputs/CustomInput";
import { toast } from "sonner";
import OutlineButton from "@/components/ui/OutlineButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import fastApiAxios from "@/utils/fastapi_axios";

const LINKS_PER_PAGE = 6; // 3 rows × 2 columns

export default function KnowledgeBaseLinksList() {
  const dispatch = useDispatch();
  const knowledgeBaseLinks = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseLinks
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [manualLinkDialogOpen, setManualLinkDialogOpen] = useState(false);
  const [manualLink, setManualLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Filter links based on search term
  const filteredLinks = useMemo(() => {
    if (!searchTerm.trim()) {
      return knowledgeBaseLinks;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return knowledgeBaseLinks.filter((item) =>
      item.link.toLowerCase().includes(lowerSearchTerm)
    );
  }, [knowledgeBaseLinks, searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredLinks.length / LINKS_PER_PAGE);
  const startIndex = (currentPage - 1) * LINKS_PER_PAGE;
  const endIndex = startIndex + LINKS_PER_PAGE;
  const currentLinks = filteredLinks.slice(startIndex, endIndex);

  // Reset to page 1 if current page is out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

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

  const handleRemoveLink = (linkToRemove: string) => {
    dispatch(removeKnowledgeBaseLink(linkToRemove));
  };

  const handleToggleCheckbox = (index: number) => {
    dispatch(toggleKnowledgeBaseLink(index));
  };

  const handleToggleAll = () => {
    // If all are checked, uncheck all. Otherwise, check all.
    dispatch(toggleAllKnowledgeBaseLinks(!allChecked));
  };

  const handleClearSelected = () => {
    setClearDialogOpen(true);
  };

  const handleConfirmClearSelected = () => {
    // Remove all checked links
    const uncheckedLinks = knowledgeBaseLinks.filter((item) => !item.checked);
    dispatch(setKnowledgeBaseLinks(uncheckedLinks));
    setClearDialogOpen(false);
  };

  const handleAddManualLink = async () => {
    if (manualLink.trim()) {
      setIsLoading(true);
      try {
        // Ping the URL to validate and normalize it
        const pingResponse = await fastApiAxios.post(
          "/elysium-agents/elysium-atlas/v1/ping-url",
          { url: manualLink.trim() }
        );

        if (pingResponse.data.success && pingResponse.data.data.reachable) {
          const normalizedUrl = pingResponse.data.data.normalized_url;

          // Check if the normalized URL already exists
          const exists = knowledgeBaseLinks.some(
            (item) => item.link === normalizedUrl
          );

          if (!exists) {
            const newLink: KnowledgeBaseLink = {
              link: normalizedUrl,
              checked: true,
              status: "new",
            };
            dispatch(setKnowledgeBaseLinks([newLink, ...knowledgeBaseLinks]));
            setManualLink("");
            toast.success("Link added successfully");
          } else {
            toast.error("Link already exists in the list.");
          }
        } else {
          toast.error(
            "URL is not reachable. Please check the URL and try again."
          );
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to validate URL. Please try again.";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Please enter a valid link");
    }
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

  if (knowledgeBaseLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="lg:text-[14px] text-[12px] font-bold text-deep-onyx dark:text-pure-mist">
          Links Found ({knowledgeBaseLinks.length})
          {searchTerm && (
            <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
              ({filteredLinks.length} found)
            </span>
          )}
        </div>
        {knowledgeBaseLinks.length > 0 && (
          <div className="flex items-center gap-2">
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
        )}
      </div>

      {/* Master Checkbox, Clear Selected, and Pagination */}
      <div className="flex items-center justify-between mb-3 px-[10px] flex-wrap gap-2">
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
        {totalPages > 1 && (
          <div className="w-full md:w-auto flex justify-end md:justify-start">
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
      </div>

      {filteredLinks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-[12px]">
          No links found matching "{searchTerm}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {currentLinks.map((item, localIndex) => {
            // Find the original index in the full knowledgeBaseLinks array
            const originalIndex = knowledgeBaseLinks.findIndex(
              (linkItem) => linkItem.link === item.link
            );
            return (
              <div
                key={item.link}
                onClick={() => handleToggleCheckbox(originalIndex)}
                className="group flex items-center justify-between gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 w-full cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Checkbox
                    id={`link-${originalIndex}`}
                    checked={item.checked}
                    onCheckedChange={() => handleToggleCheckbox(originalIndex)}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 border-2 border-gray-300 dark:border-gray-500 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-mono text-[12px] text-gray-700 dark:text-gray-300 truncate flex-1 min-w-0 cursor-default">
                        {highlightMatch(item.link, searchTerm)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs break-all">{item.link}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLink(item.link);
                    }}
                    className="group/btn p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                    aria-label="Remove link"
                  >
                    <X className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 group-hover/btn:text-danger-red transition-colors" />
                  </button>
                  <Link
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    title="Open link in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
