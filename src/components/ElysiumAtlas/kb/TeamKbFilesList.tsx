"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Search,
  Trash2,
  FileText,
  RefreshCw,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePaginationControls from "../TablePaginationControls";
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
import CustomInput from "@/components/inputs/CustomInput";
import Spinner from "@/components/ui/Spinner";
import PrimaryButton from "@/components/ui/PrimaryButton";
import KbStatusBadge from "./KbStatusBadge";
import KbSearchingTableRow from "./KbSearchingTableRow";
import type { KbFileDisplayItem } from "./TeamKbFiles";
import { deleteFile, reindexItem } from "@/utils/kbItemsApi";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import { toast } from "sonner";
import NProgress from "nprogress";
import { formatDateTime12hr } from "@/utils/formatDate";
import { isKbSearchInProgress } from "@/utils/kbSearchUi";

interface TeamKbFilesListProps {
  files: KbFileDisplayItem[];
  setFiles: React.Dispatch<React.SetStateAction<KbFileDisplayItem[]>>;
  searchQuery: string;
  debouncedSearchQuery: string;
  onSearchChange: (query: string) => void;
  isSearchActive?: boolean;
  isLoadingFiles: boolean;
  onRemoveFile: (fileName: string) => void;
  onRefresh: () => void;
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

export default function TeamKbFilesList({
  files,
  setFiles,
  searchQuery,
  debouncedSearchQuery,
  onSearchChange,
  isSearchActive = false,
  isLoadingFiles,
  onRemoveFile,
  onRefresh,
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
}: TeamKbFilesListProps) {
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<KbFileDisplayItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [reindexingKbId, setReindexingKbId] = useState<string | null>(null);

  const isSearching = isKbSearchInProgress(
    searchQuery,
    debouncedSearchQuery,
    isLoadingFiles,
  );
  const displayFiles = isSearching ? [] : files;

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
  }, [displayFiles]);

  const allChecked = useMemo(() => {
    if (files.length === 0) return false;
    return files.every((item) => item.checked);
  }, [files]);

  const hasUnchecked = useMemo(() => {
    return files.some((item) => !item.checked);
  }, [files]);

  const hasChecked = useMemo(() => {
    return files.some((item) => item.checked);
  }, [files]);

  const checkedFilesCount = useMemo(() => {
    return files.filter((item) => item.checked).length;
  }, [files]);

  const newFilesCount = useMemo(
    () => files.filter((f) => f.status === "new").length,
    [files],
  );

  const handleToggleCheckbox = (index: number) => {
    setFiles((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const handleToggleAll = () => {
    setFiles((prev) => prev.map((item) => ({ ...item, checked: !allChecked })));
  };

  const handleRemoveFile = (item: KbFileDisplayItem) => {
    if (item.status === "new" || !item.kb_id) {
      onRemoveFile(item.file_name);
    } else {
      setFileToDelete(item);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDeleteFile = async () => {
    if (!fileToDelete?.kb_id) return;

    setIsDeleting(true);
    try {
      const response = await deleteFile(fileToDelete.kb_id);
      if (response.success) {
        toast.success("File deleted successfully");
        onRemoveFile(fileToDelete.file_name);
        setDeleteDialogOpen(false);
        setFileToDelete(null);
        onRefresh();
      } else {
        toast.error(response.message || "Failed to delete file");
      }
    } catch (error: unknown) {
      toast.error(extractApiErrorMessage(error, "Failed to delete file"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmClearSelected = async () => {
    const filesToRemove = files.filter((item) => item.checked);
    const existingFilesToRemove = filesToRemove.filter(
      (item) => item.status !== "new" && item.kb_id,
    );
    const newFilesToRemove = filesToRemove.filter(
      (item) => item.status === "new" || !item.kb_id,
    );

    setClearDialogOpen(false);
    NProgress.start();

    try {
      if (existingFilesToRemove.length > 0) {
        setIsDeleting(true);
        try {
          await Promise.all(
            existingFilesToRemove.map((f) => deleteFile(f.kb_id)),
          );
          toast.success(
            `${existingFilesToRemove.length} file(s) deleted successfully`,
          );
        } catch (error: unknown) {
          toast.error(extractApiErrorMessage(error, "Failed to delete files"));
          return;
        }
      }

      const removedNames = new Set(filesToRemove.map((f) => f.file_name));
      setFiles((prev) =>
        prev.filter((item) => !removedNames.has(item.file_name)),
      );
      newFilesToRemove.forEach((f) => onRemoveFile(f.file_name));

      if (existingFilesToRemove.length > 0) {
        onRefresh();
      }
    } finally {
      setIsDeleting(false);
      NProgress.done();
    }
  };

  const handleReindex = async (item: KbFileDisplayItem) => {
    if (!item.kb_id) return;

    setReindexingKbId(item.kb_id);
    try {
      const response = await reindexItem(item.kb_id, "file");
      if (response.success) {
        toast.success("Re-indexing started");
        onRefresh();
      } else {
        toast.error(response.message || "Failed to re-index file");
      }
    } catch (error: unknown) {
      toast.error(extractApiErrorMessage(error, "Failed to re-index file"));
    } finally {
      setReindexingKbId(null);
    }
  };

  const highlightMatch = (text: string, term: string) => {
    if (!term.trim()) {
      return text;
    }

    const lowerText = text.toLowerCase();
    const lowerSearchTerm = term.toLowerCase();
    const index = lowerText.indexOf(lowerSearchTerm);

    if (index === -1) {
      return text;
    }

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

  const fileColumnCount = readOnly ? 2 : 4;
  const emptyFilesMessage = isSearchActive
    ? `No files found matching "${debouncedSearchQuery}"`
    : "No files found";

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-end mb-4">
        <div className="relative w-[200px] md:w-[300px] h-[41px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <CustomInput
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-[41px] min-h-[41px] pl-9 pr-3 text-[12px]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 px-[10px] flex-wrap gap-2">
        {!readOnly && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="master-checkbox-kb-files"
                checked={allChecked}
                onCheckedChange={handleToggleAll}
                className="border-2 border-gray-300 dark:border-gray-500 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white dark:data-[state=checked]:text-black"
              />
              <label
                htmlFor="master-checkbox-kb-files"
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
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete File</DialogTitle>
              <DialogDescription>
                This will permanently delete this file from your team knowledge
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
                    File name
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
                {isSearching ? (
                  <KbSearchingTableRow
                    colSpan={fileColumnCount}
                    query={searchQuery.trim()}
                  />
                ) : isLoadingFiles && displayFiles.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={fileColumnCount}
                      className="py-10 text-center"
                    >
                      <Spinner className="border-serene-purple dark:border-pure-mist mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : displayFiles.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={fileColumnCount}
                      className="py-10 text-center text-[12px] text-gray-500 dark:text-gray-400"
                    >
                      {emptyFilesMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayFiles.map((item) => {
                    const originalIndex = files.findIndex(
                      (fileItem) => fileItem.file_name === item.file_name,
                    );
                    return (
                      <TableRow
                        key={`${item.kb_id || "new"}-${item.file_name}`}
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
                              id={`kb-file-${originalIndex}`}
                              checked={item.checked ?? false}
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
                            <FileText
                              size={18}
                              className="text-serene-purple shrink-0"
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono text-[12px] truncate block min-w-0">
                                  {highlightMatch(item.file_name, debouncedSearchQuery)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs break-all">
                                  {item.file_name}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                            <KbStatusBadge status={item.status} mode="team" />
                            {!readOnly &&
                              item.status === "failed" &&
                              item.kb_id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReindex(item);
                                  }}
                                  disabled={reindexingKbId === item.kb_id}
                                  className="p-1 rounded-[6px] text-serene-purple hover:bg-serene-purple/10 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                                  aria-label="Re-index file"
                                >
                                  <RefreshCw
                                    size={12}
                                    className={
                                      reindexingKbId === item.kb_id
                                        ? "animate-spin"
                                        : ""
                                    }
                                  />
                                </button>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 pl-8 md:pl-12 pr-[10px] text-[14px] whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {item.updated_at
                            ? formatDateTime12hr(item.updated_at)
                            : "—"}
                        </TableCell>
                        {!readOnly && (
                          <TableCell className="w-[60px] text-right py-4 px-[10px] whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(item);
                              }}
                              className="p-2 rounded-[8px] text-danger-red hover:bg-danger-red hover:text-white transition-colors cursor-pointer"
                              aria-label="Remove file"
                            >
                              {item.status === "new" || !item.kb_id ? (
                                <X size={14} />
                              ) : (
                                <Trash2 size={14} />
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
        {showRightGradient && displayFiles.length > 0 && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
        )}
      </div>

      <TablePaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrev={hasPrev}
        total={total}
        totalRecords={isSearchActive ? total : total + newFilesCount}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        isLoading={isLoadingFiles}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        className="mt-3 mb-4"
      />
    </div>
  );
}
