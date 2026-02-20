"use client";
import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  FileText,
} from "lucide-react";
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
  toggleKnowledgeBaseFile,
  toggleAllKnowledgeBaseFiles,
  removeKnowledgeBaseFile,
  setKnowledgeBaseFiles,
} from "@/store/reducers/agentSlice";
import { FileMetadata } from "@/store/types/AgentBuilderTypes";
import CustomInput from "@/components/inputs/CustomInput";
import Spinner from "@/components/ui/Spinner";
import Badge from "@/components/ui/Badge";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Pill from "@/components/ui/Pill";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { formatDateTime12hr } from "@/utils/formatDate";

const FILES_PER_PAGE = 6; // 3 rows × 2 columns

interface AgentFilesListProps {
  isLoadingFiles: boolean;
  onRemoveFile: (fileName: string) => void;
}

export default function AgentFilesList({
  isLoadingFiles,
  onRemoveFile,
}: AgentFilesListProps) {
  const dispatch = useDispatch();
  const knowledgeBaseFiles = useSelector(
    (state: RootState) => state.agent.knowledgeBaseFiles,
  );
  const agentID = useSelector((state: RootState) => state.agent.agentID);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter files based on search term
  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) {
      return knowledgeBaseFiles;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return knowledgeBaseFiles.filter((item) =>
      item.name.toLowerCase().includes(lowerSearchTerm),
    );
  }, [knowledgeBaseFiles, searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredFiles.length / FILES_PER_PAGE);
  const startIndex = (currentPage - 1) * FILES_PER_PAGE;
  const endIndex = startIndex + FILES_PER_PAGE;
  const currentFiles = filteredFiles.slice(startIndex, endIndex);

  // Reset to page 1 if current page is out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  // Calculate if all files are checked
  const allChecked = useMemo(() => {
    if (knowledgeBaseFiles.length === 0) return false;
    return knowledgeBaseFiles.every((item) => item.checked);
  }, [knowledgeBaseFiles]);

  // Calculate if at least one is unchecked
  const hasUnchecked = useMemo(() => {
    return knowledgeBaseFiles.some((item) => !item.checked);
  }, [knowledgeBaseFiles]);

  // Calculate if any files are checked
  const hasChecked = useMemo(() => {
    return knowledgeBaseFiles.some((item) => item.checked);
  }, [knowledgeBaseFiles]);

  // Count checked files
  const checkedFilesCount = useMemo(() => {
    return knowledgeBaseFiles.filter((item) => item.checked).length;
  }, [knowledgeBaseFiles]);

  const handleRemoveFile = (fileName: string, isExisting: boolean) => {
    if (isExisting) {
      setFileToDelete(fileName);
      setDeleteDialogOpen(true);
    } else {
      // For new files, remove from both local state and Redux via parent callback
      onRemoveFile(fileName);
    }
  };

  const handleConfirmDeleteFile = async () => {
    if (!fileToDelete) return;

    if (!agentID) {
      toast.error("Agent ID not found");
      return;
    }

    setIsDeleting(true);
    const token = Cookies.get("elysium_atlas_session_token");

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/delete-agent-files",
        {
          agent_id: agentID,
          files: [fileToDelete],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        toast.success("File deleted successfully");
        // Remove from Redux and local state via parent callback
        onRemoveFile(fileToDelete);
        setDeleteDialogOpen(false);
        setFileToDelete(null);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete file";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleCheckbox = (index: number) => {
    dispatch(toggleKnowledgeBaseFile(index));
  };

  const handleToggleAll = () => {
    dispatch(toggleAllKnowledgeBaseFiles(!allChecked));
  };

  const handleClearSelected = () => {
    setClearDialogOpen(true);
  };

  const handleConfirmClearSelected = async () => {
    // Separate picked files into existing (need API delete) and new (just Redux remove)
    const filesToRemove = knowledgeBaseFiles.filter((item) => item.checked);
    const existingFilesToRemove = filesToRemove.filter(
      (item) => item.status !== "new",
    );

    // If there are existing files to delete, call API
    if (existingFilesToRemove.length > 0) {
      if (!agentID) {
        toast.error("Agent ID not found");
        return;
      }

      setIsDeleting(true);
      const token = Cookies.get("elysium_atlas_session_token");

      try {
        const response = await fastApiAxios.post(
          "/elysium-agents/elysium-atlas/agent/v1/delete-agent-files",
          {
            agent_id: agentID,
            files: existingFilesToRemove.map((f) => f.name),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success) {
          toast.success(
            `${existingFilesToRemove.length} file(s) deleted successfully`,
          );
        } else {
          // If API fails, don't remove from UI? Or try to remove just new ones?
          // For now, abort if API fails to keep state consistent
          setIsDeleting(false);
          return;
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to delete files";
        toast.error(errorMessage);
        setIsDeleting(false);
        return;
      }
    }

    // If we reached here, API call succeeded or wasn't needed.
    // Now remove ALL selected files (new + existing) from Redux.
    // The reverse sync in AgentFiles.tsx will handle local state for new files.
    const uncheckedFiles = knowledgeBaseFiles.filter((item) => !item.checked);
    dispatch(setKnowledgeBaseFiles(uncheckedFiles));

    setClearDialogOpen(false);
    setIsDeleting(false);
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (knowledgeBaseFiles.length === 0 && !isLoadingFiles) {
    return null;
  }

  return (
    <div className="flex flex-col mt-6">
      {isLoadingFiles && knowledgeBaseFiles.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <Spinner className="border-serene-purple dark:border-pure-mist" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="lg:text-[14px] text-[12px] font-bold text-deep-onyx dark:text-pure-mist">
              Files ({knowledgeBaseFiles.length})
              {searchTerm && (
                <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                  ({filteredFiles.length} found)
                </span>
              )}
            </div>
            {knowledgeBaseFiles.length > 0 && (
              <div className="relative w-[200px] md:w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <CustomInput
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-[11px] h-8"
                />
              </div>
            )}
          </div>

          {/* Master Checkbox, Clear Selected, and Pagination */}
          <div className="flex items-center justify-between mb-3 px-[10px] flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="master-checkbox-files"
                  checked={allChecked}
                  onCheckedChange={handleToggleAll}
                  className="border-2 border-gray-300 dark:border-gray-500 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                />
                <label
                  htmlFor="master-checkbox-files"
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
                        <DialogTitle>Clear Selected Files</DialogTitle>
                        <DialogDescription>
                          This will remove {checkedFilesCount}{" "}
                          {checkedFilesCount === 1 ? "file" : "files"} from your
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
            {/* Delete File Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Delete File</DialogTitle>
                  <DialogDescription>
                    This will permanently delete this file from your agent's
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
                    className="text-[12px] font-semibold bg-danger-red hover:bg-danger-red/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleConfirmDeleteFile}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
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

          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-[12px]">
              {searchTerm
                ? `No files found matching "${searchTerm}"`
                : "No files found"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {currentFiles.map((item, localIndex) => {
                const originalIndex = knowledgeBaseFiles.findIndex(
                  (fileItem) => fileItem.name === item.name,
                );
                return (
                  <div
                    key={item.name}
                    onClick={() => handleToggleCheckbox(originalIndex)}
                    className="group flex items-center justify-between gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 w-full cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Checkbox
                        id={`file-${originalIndex}`}
                        checked={item.checked ?? true}
                        onCheckedChange={() =>
                          handleToggleCheckbox(originalIndex)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 border-2 border-gray-300 dark:border-gray-500 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                      />
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <FileText
                          size={20}
                          className="text-serene-purple shrink-0"
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono text-[12px] text-gray-700 dark:text-gray-300 truncate cursor-pointer">
                                  {highlightMatch(item.name, searchTerm)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs break-all">
                                  {item.name}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                            {item.status === "new" ? (
                              <Badge>New</Badge>
                            ) : item.status !== "indexed" ? (
                              <span
                                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 flex items-center gap-[1px] ${
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
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            {item.updated_at ? (
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                updated at {formatDateTime12hr(item.updated_at)}
                              </span>
                            ) : item.size > 0 ? (
                              formatFileSize(item.size)
                            ) : null}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(item.name, item.status !== "new");
                        }}
                        className="group/btn p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                        aria-label="Remove file"
                      >
                        {item.status !== "new" ? (
                          <Trash2 className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 group-hover/btn:text-danger-red transition-colors" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 group-hover/btn:text-danger-red transition-colors" />
                        )}
                      </button>
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
