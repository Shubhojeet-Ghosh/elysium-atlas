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
  Trash,
  RotateCcw,
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
  setTriggerFetchAgentUrls,
} from "@/store/reducers/agentSlice";
import { useAppSelector } from "@/store";
import { KnowledgeBaseLink } from "@/store/types/AgentBuilderTypes";
import CustomInput from "@/components/inputs/CustomInput";
import { toast } from "sonner";
import OutlineButton from "@/components/ui/OutlineButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import Badge from "@/components/ui/Badge";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import NProgress from "nprogress";
import { formatDateTime12hr } from "@/utils/formatDate";

const LINKS_PER_PAGE = 6; // 3 rows × 2 columns

interface AgentLinksListProps {
  isLoadingLinks: boolean;
}

export default function AgentLinksList({
  isLoadingLinks,
}: AgentLinksListProps) {
  const dispatch = useDispatch();
  const knowledgeBaseLinks = useSelector(
    (state: RootState) => state.agent.knowledgeBaseLinks,
  );
  const agentID = useSelector((state: RootState) => state.agent.agentID);
  const triggerFetchAgentUrls = useAppSelector(
    (state) => state.agent.triggerFetchAgentUrls,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [reindexDialogOpen, setReindexDialogOpen] = useState(false);
  const [singleReindexDialogOpen, setSingleReindexDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);
  const [linkToReindex, setLinkToReindex] = useState<string | null>(null);
  const [manualLinkDialogOpen, setManualLinkDialogOpen] = useState(false);
  const [manualLink, setManualLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reindexingLink, setReindexingLink] = useState<string | null>(null);
  const [deletingLink, setDeletingLink] = useState<string | null>(null);

  // Filter links based on search term (client-side filtering of already loaded data)
  const filteredLinks = useMemo(() => {
    if (!searchTerm.trim()) {
      return knowledgeBaseLinks;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return knowledgeBaseLinks.filter((item) =>
      item.link.toLowerCase().includes(lowerSearchTerm),
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

  // Check if any existing links are checked (for showing Reindex Selected)
  const hasExistingChecked = useMemo(() => {
    return knowledgeBaseLinks.some(
      (item) => item.checked && item.status === "existing",
    );
  }, [knowledgeBaseLinks]);

  const handleRemoveLink = (linkToRemove: string, isExisting: boolean) => {
    if (isExisting) {
      setLinkToDelete(linkToRemove);
      setDeleteDialogOpen(true);
    } else {
      // For new links, just remove from Redux without API call
      dispatch(removeKnowledgeBaseLink(linkToRemove));
    }
  };

  const handleConfirmDeleteLink = async () => {
    if (!linkToDelete) return;

    setDeleteDialogOpen(false);
    setDeletingLink(linkToDelete);
    try {
      await deleteAgentLinks([linkToDelete]);
      // Remove from Redux after successful API call
      dispatch(removeKnowledgeBaseLink(linkToDelete));
    } catch (error: any) {
      // Error toast already shown in deleteAgentLinks
    } finally {
      setDeletingLink(null);
      setLinkToDelete(null);
    }
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

  const handleConfirmClearSelected = async () => {
    const checkedLinks = knowledgeBaseLinks.filter((item) => item.checked);
    const existingLinks = checkedLinks
      .filter((item) => item.status === "existing")
      .map((item) => item.link);

    setClearDialogOpen(false);

    try {
      // If there are existing links, call the API to delete them
      if (existingLinks.length > 0) {
        await deleteAgentLinks(existingLinks);
      }

      // Remove all checked links from Redux (both new and existing)
      const uncheckedLinks = knowledgeBaseLinks.filter((item) => !item.checked);
      dispatch(setKnowledgeBaseLinks(uncheckedLinks));
    } catch (error: any) {
      // Error toast already shown in deleteAgentLinks
    }
  };

  const handleReindexSelected = () => {
    setReindexDialogOpen(true);
  };

  const handleConfirmReindexSelected = async () => {
    const checkedLinks = knowledgeBaseLinks.filter((item) => item.checked);
    const linksToReindex = checkedLinks.map((item) => item.link);

    setReindexDialogOpen(false);

    try {
      await updateAgentLinks(linksToReindex);
    } catch (error: any) {
      // Error toast already shown in updateAgentLinks
    }
  };

  const updateAgentLinks = async (links: string[]) => {
    if (!agentID) {
      toast.error("Agent ID not found");
      return;
    }

    const token = Cookies.get("elysium_atlas_session_token");

    // Start progress bar
    NProgress.start();

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/update-agent",
        {
          agent_id: agentID,
          links: links,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success === true) {
        toast.success(response.data.message || "Agent updated successfully");
        dispatch(setTriggerFetchAgentUrls(triggerFetchAgentUrls + 1));
        NProgress.done();
        return response.data;
      } else {
        const errorMsg = response.data.message || "Failed to update agent";
        toast.error(errorMsg);
        NProgress.done();
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update agent links";
      toast.error(errorMessage);
      NProgress.done();
      throw new Error(errorMessage);
    }
  };

  const deleteAgentLinks = async (links: string[]) => {
    if (!agentID) {
      toast.error("Agent ID not found");
      return;
    }

    const token = Cookies.get("elysium_atlas_session_token");

    // Start progress bar
    NProgress.start();

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/remove-agent-links",
        {
          agent_id: agentID,
          links: links,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success === true) {
        toast.success(
          response.data.message || "Successfully removed links from agent",
        );
        NProgress.done();
        return response.data;
      } else {
        const errorMsg = response.data.message || "Failed to delete links";
        toast.error(errorMsg);
        NProgress.done();
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete agent links";
      toast.error(errorMessage);
      NProgress.done();
      throw new Error(errorMessage);
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
      await updateAgentLinks([linkToReindex]);
    } catch (error: any) {
      // Error toast already shown in updateAgentLinks
    } finally {
      setReindexingLink(null);
      setLinkToReindex(null);
    }
  };

  const handleAddManualLink = async () => {
    if (manualLink.trim()) {
      setIsLoading(true);
      try {
        // Ping the URL to validate and normalize it
        const pingResponse = await fastApiAxios.post(
          "/elysium-agents/elysium-atlas/v1/ping-url",
          { url: manualLink.trim() },
        );

        if (pingResponse.data.success && pingResponse.data.data.reachable) {
          const normalizedUrl = pingResponse.data.data.normalized_url;

          // Check if the normalized URL already exists
          const exists = knowledgeBaseLinks.some(
            (item) => item.link === normalizedUrl,
          );

          if (!exists) {
            const newLink: KnowledgeBaseLink = {
              link: normalizedUrl,
              checked: true,
              status: "new",
              updated_at: null,
            };
            dispatch(setKnowledgeBaseLinks([newLink, ...knowledgeBaseLinks]));
            setManualLink("");
            toast.success("Link added successfully");
          } else {
            toast.error("Link already exists in the list.");
          }
        } else {
          toast.error(
            "URL is not reachable. Please check the URL and try again.",
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

  if (knowledgeBaseLinks.length === 0 && !isLoadingLinks) {
    return null;
  }

  return (
    <div className="flex flex-col mt-6">
      {isLoadingLinks && knowledgeBaseLinks.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <Spinner className="border-serene-purple dark:border-pure-mist" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="lg:text-[14px] text-[12px] font-bold text-deep-onyx dark:text-pure-mist">
              Links ({knowledgeBaseLinks.length})
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
                              {checkedLinksCount === 1 ? "link" : "links"} in
                              your knowledge base.
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
            {/* Delete Link Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Delete Link</DialogTitle>
                  <DialogDescription>
                    This will permanently delete this link from your agent's
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
                    This will reindex this link in your knowledge base. The
                    agent will re-crawl and re-index the content from this URL.
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
                      },
                    )}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
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
              {searchTerm
                ? `No links found matching "${searchTerm}"`
                : "No links found"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {currentLinks.map((item, localIndex) => {
                // Find the original index in the full knowledgeBaseLinks array
                const originalIndex = knowledgeBaseLinks.findIndex(
                  (linkItem) => linkItem.link === item.link,
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
                        onCheckedChange={() =>
                          handleToggleCheckbox(originalIndex)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 border-2 border-gray-300 dark:border-gray-500 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                      />
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-mono text-[12px] text-gray-700 dark:text-gray-300 truncate cursor-default">
                                {highlightMatch(item.link, searchTerm)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs break-all">{item.link}</p>
                            </TooltipContent>
                          </Tooltip>
                          {item.status === "new" ? (
                            <Badge>New</Badge>
                          ) : item.api_status &&
                            item.api_status !== "indexed" ? (
                            <span
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 flex items-center gap-[1px] ${
                                item.api_status === "indexed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                  : item.api_status === "indexing"
                                    ? "bg-serene-purple/10 text-[#6c5f8d] dark:bg-serene-purple/20 dark:text-[#c4bcd6]"
                                    : item.api_status === "failed" ||
                                        item.api_status === "error"
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                      : item.api_status === "pending"
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {item.api_status === "indexing" ? (
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
                                item.api_status.charAt(0).toUpperCase() +
                                item.api_status.slice(1)
                              )}
                            </span>
                          ) : null}
                        </div>
                        {item.updated_at && (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            updated at {formatDateTime12hr(item.updated_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === "existing" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReindexLink(item.link);
                              }}
                              disabled={reindexingLink === item.link}
                              className="group/btn p-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Reindex link"
                            >
                              {reindexingLink === item.link ? (
                                <Spinner className="h-3.5 w-3.5 border-serene-purple dark:border-pure-mist" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 group-hover/btn:text-serene-purple transition-colors" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reindex this link</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveLink(
                                item.link,
                                item.status === "existing",
                              );
                            }}
                            disabled={deletingLink === item.link}
                            className="group/btn p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Remove link"
                          >
                            {deletingLink === item.link ? (
                              <Spinner className="h-3.5 w-3.5 border-danger-red dark:border-danger-red" />
                            ) : item.status === "existing" ? (
                              <Trash className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 group-hover/btn:text-danger-red transition-colors" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 group-hover/btn:text-danger-red transition-colors" />
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
                      <Link
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
