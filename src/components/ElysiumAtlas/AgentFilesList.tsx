"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  X,
  Search,
  Trash2,
  FileText,
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
import { type VisitorPageSize } from "@/lib/config";
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

interface AgentFilesListProps {
  isLoadingFiles: boolean;
  onRemoveFile: (fileName: string) => void;
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
}

export default function AgentFilesList({
  isLoadingFiles,
  onRemoveFile,
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
}: AgentFilesListProps) {
  const dispatch = useDispatch();
  const knowledgeBaseFiles = useSelector(
    (state: RootState) => state.agent.knowledgeBaseFiles,
  );
  const agentID = useSelector((state: RootState) => state.agent.agentID);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

  const currentFiles = filteredFiles;

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
  }, [currentFiles]);

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

  const fileColumnCount = readOnly ? 3 : 5;
  const emptyFilesMessage = searchTerm
    ? `No files found matching "${searchTerm}"`
    : "No files found";

  return (
    <div className="flex flex-col mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="lg:text-[14px] text-[12px] font-bold text-deep-onyx dark:text-pure-mist">
              Files ({total + knowledgeBaseFiles.filter((f) => f.status === "new").length})
              {searchTerm && (
                <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                  ({filteredFiles.length} found)
                </span>
              )}
            </div>
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
          </div>

          {/* Master Checkbox, Clear Selected, and Pagination */}
          <div className="flex items-center justify-between mb-3 px-[10px] flex-wrap gap-2">
            {!readOnly && (
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
            )}
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
          </div>

          <TablePaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            hasNext={hasNext}
            hasPrev={hasPrev}
            total={total}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            isLoading={isLoadingFiles}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />

          <div className="relative">
              <div
                ref={scrollContainerRef}
                className="overflow-x-auto md:overflow-visible"
              >
                <div className="inline-block min-w-full align-middle">
                  <Table className="w-full table-fixed min-w-[600px] lg:min-w-full">
                    <colgroup>
                      {!readOnly && <col className="w-[40px]" />}
                      <col className="w-[38%]" />
                      <col className="w-[96px]" />
                      <col className="w-[32%]" />
                      {!readOnly && <col className="w-[60px]" />}
                    </colgroup>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        {!readOnly && (
                          <TableHead className="font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap" />
                        )}
                        <TableHead className="font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          File name
                        </TableHead>
                        <TableHead className="font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap text-center">
                          Status
                        </TableHead>
                        <TableHead className="font-[600] py-3 pl-8 md:pl-12 pr-[10px] text-[14px] whitespace-nowrap">
                          Updated at
                        </TableHead>
                        {!readOnly && (
                          <TableHead className="w-[60px] text-right font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap" />
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingFiles && currentFiles.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={fileColumnCount}
                            className="py-10 text-center"
                          >
                            <Spinner className="border-serene-purple dark:border-pure-mist mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : currentFiles.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={fileColumnCount}
                            className="py-10 text-center text-[12px] text-gray-500 dark:text-gray-400"
                          >
                            {emptyFilesMessage}
                          </TableCell>
                        </TableRow>
                      ) : (
                      currentFiles.map((item) => {
                        const originalIndex = knowledgeBaseFiles.findIndex(
                          (fileItem) => fileItem.name === item.name,
                        );
                        return (
                          <TableRow
                            key={item.name}
                            onClick={() => {
                              if (!readOnly) handleToggleCheckbox(originalIndex);
                            }}
                            className={`border-b border-gray-100 dark:border-deep-onyx transition-all duration-200 ${
                              readOnly ? "" : "cursor-pointer hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20"
                            }`}
                          >
                            {!readOnly && (
                              <TableCell className="py-4 px-[10px] whitespace-nowrap">
                                <Checkbox
                                  id={`file-${originalIndex}`}
                                  checked={item.checked ?? true}
                                  onCheckedChange={() =>
                                    handleToggleCheckbox(originalIndex)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="border-2 border-gray-300 dark:border-gray-500 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-medium py-4 px-[10px] text-[14px] text-deep-onyx dark:text-pure-mist overflow-hidden">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText size={18} className="text-serene-purple shrink-0" />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="font-mono text-[12px] truncate block min-w-0">
                                      {highlightMatch(item.name, searchTerm)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs break-all">{item.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-[10px] text-[14px] whitespace-nowrap text-center">
                              <div className="flex items-center justify-center">
                              {item.status === "new" ? (
                                <Badge>New</Badge>
                              ) : item.status !== "indexed" ? (
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 inline-flex items-center gap-[1px] ${
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
                              ) : (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-0">
                                  Indexed
                                </Badge>
                              )}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 pl-8 md:pl-12 pr-[10px] text-[14px] whitespace-nowrap text-gray-500 dark:text-gray-400">
                              {item.updated_at
                                ? formatDateTime12hr(item.updated_at)
                                : item.size > 0
                                  ? formatFileSize(item.size)
                                  : "—"}
                            </TableCell>
                            {!readOnly && (
                              <TableCell className="w-[60px] text-right py-4 px-[10px] whitespace-nowrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFile(item.name, item.status !== "new");
                                  }}
                                  className="p-2 rounded-[8px] text-danger-red hover:bg-danger-red hover:text-white transition-colors cursor-pointer"
                                  aria-label="Remove file"
                                >
                                  {item.status !== "new" ? (
                                    <Trash2 size={14} />
                                  ) : (
                                    <X size={14} />
                                  )}
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
              {showRightGradient && currentFiles.length > 0 && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
              )}
            </div>
    </div>
  );
}
