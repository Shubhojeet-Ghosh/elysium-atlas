"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { X, Search, Trash2, FileText, BookOpen } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePaginationControls from "./TablePaginationControls";
import { VISITOR_PAGE_SIZE_OPTIONS, type VisitorPageSize } from "@/lib/config";
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
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import { toast } from "sonner";
import { formatDateTime12hr } from "@/utils/formatDate";
import AgentKbPickFromLibraryDialog, {
  type AgentKbLibraryPick,
} from "./kb/AgentKbPickFromLibraryDialog";
import {
  buildKbAttachmentsFromState,
  getFileAgentKbDisplayStatus,
  paginateItems,
} from "@/utils/agentKbUtils";
import { updateAgentKb } from "@/utils/agentKbApi";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import KbStatusBadge from "./kb/KbStatusBadge";
import { useIsKbBuildFlow } from "./kb/KbDatasourceModeContext";
import {
  useKbFilesState,
  useKbLinksState,
  useKbTextState,
  useKbQnAState,
  useKbAgentId,
  useKbDatasourceActions,
} from "./kb/useKbDatasourceState";

interface AgentFilesListProps {
  isLoadingFiles: boolean;
  onRemoveFile: (fileName: string) => void;
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
  localPagination?: boolean;
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
  onPageChange,
  onPageSizeChange,
  onRefresh,
  localPagination = false,
}: AgentFilesListProps) {
  const isBuild = useIsKbBuildFlow();
  const kbActions = useKbDatasourceActions();
  const dispatch = useDispatch();
  const knowledgeBaseFiles = useKbFilesState();
  const knowledgeBaseLinks = useKbLinksState();
  const knowledgeBaseText = useKbTextState();
  const knowledgeBaseQnA = useKbQnAState();
  const agentID = useKbAgentId();

  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [searchPage, setSearchPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSearchActive = Boolean(searchTerm.trim());

  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) {
      return knowledgeBaseFiles;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return knowledgeBaseFiles.filter((item) =>
      item.name.toLowerCase().includes(lowerSearchTerm),
    );
  }, [knowledgeBaseFiles, searchTerm]);

  const searchPagination = useMemo(
    () => paginateItems(filteredFiles, searchPage, pageSize),
    [filteredFiles, searchPage, pageSize],
  );

  const listPagination = useMemo(
    () => paginateItems(filteredFiles, currentPage, pageSize),
    [filteredFiles, currentPage, pageSize],
  );

  const currentFiles = isSearchActive
    ? searchPagination.pageItems
    : localPagination
      ? listPagination.pageItems
      : filteredFiles;

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

  const pendingCount = useMemo(
    () =>
      knowledgeBaseFiles.filter(
        (f) => f.status === "new" || f.status === "pending_attach",
      ).length,
    [knowledgeBaseFiles],
  );

  const displayStatus = (item: FileMetadata) =>
    getFileAgentKbDisplayStatus(item);

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

  const handleRemoveFile = (fileName: string, isPersisted: boolean) => {
    if (isBuild || !isPersisted) {
      onRemoveFile(fileName);
      return;
    }
    setFileToDelete(fileName);
    setDeleteDialogOpen(true);
  };

  const buildCurrentKbState = () => ({
    knowledgeBaseLinks,
    knowledgeBaseFiles,
    knowledgeBaseText,
    knowledgeBaseQnA,
  });

  const detachFilesByKbIds = async (kbIds: string[]) => {
    if (isBuild) {
      const remainingFiles = knowledgeBaseFiles.filter(
        (item) => !item.kb_id || !kbIds.includes(item.kb_id),
      );
      kbActions.setKnowledgeBaseFiles(remainingFiles);
      return;
    }

    if (!agentID) {
      toast.error("Agent ID not found");
      return;
    }

    const remainingFiles = knowledgeBaseFiles.filter(
      (item) => !item.kb_id || !kbIds.includes(item.kb_id),
    );
    const kb_attachments = buildKbAttachmentsFromState({
      ...buildCurrentKbState(),
      knowledgeBaseFiles: remainingFiles,
    });

    const response = await updateAgentKb(agentID, { kb_attachments });
    if (!response.success) {
      throw new Error(response.message || "Failed to detach file");
    }

    await onRefresh();
  };

  const handleConfirmDeleteFile = async () => {
    if (!fileToDelete) return;

    setIsDeleting(true);
    try {
      const target = knowledgeBaseFiles.find(
        (item) => item.name === fileToDelete,
      );
      if (target?.kb_id && target.status !== "new" && !isBuild) {
        await detachFilesByKbIds([target.kb_id]);
        toast.success("File detached from agent");
      }
      onRemoveFile(fileToDelete);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    } catch (error: unknown) {
      toast.error(extractApiErrorMessage(error, "Failed to detach file"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleCheckbox = (index: number) => {
    kbActions.toggleKnowledgeBaseFile(index);
  };

  const handleToggleAll = () => {
    kbActions.toggleAllKnowledgeBaseFiles(!allChecked);
  };

  const handleClearSelected = () => {
    setClearDialogOpen(true);
  };

  const handleConfirmClearSelected = async () => {
    const filesToRemove = knowledgeBaseFiles.filter((item) => item.checked);
    const persistedKbIds = filesToRemove
      .filter((item) => item.kb_id && item.status !== "new")
      .map((item) => item.kb_id as string);

    setClearDialogOpen(false);

    if (!isBuild && persistedKbIds.length > 0) {
      setIsDeleting(true);
      try {
        await detachFilesByKbIds(persistedKbIds);
        toast.success(`${persistedKbIds.length} file(s) detached from agent`);
      } catch (error: unknown) {
        toast.error(extractApiErrorMessage(error, "Failed to detach files"));
        setIsDeleting(false);
        return;
      }
      setIsDeleting(false);
    }

    filesToRemove.forEach((file) => onRemoveFile(file.name));
  };

  const handleAttachFromLibrary = (items: AgentKbLibraryPick[]) => {
    const existingKbIds = new Set(
      knowledgeBaseFiles.map((item) => item.kb_id).filter(Boolean),
    );
    const existingNames = new Set(knowledgeBaseFiles.map((item) => item.name));

    const newRows: FileMetadata[] = items
      .filter(
        (item) =>
          !existingKbIds.has(item.kb_id) && !existingNames.has(item.label),
      )
      .map((item) => ({
        kb_id: item.kb_id,
        name: item.label,
        size: 0,
        type: "",
        checked: true,
        s3_key: null,
        cdn_url: null,
        status: "pending_attach",
        updated_at: null,
      }));

    if (newRows.length === 0) {
      toast.info("Selected files are already attached or pending");
      return;
    }

    kbActions.setKnowledgeBaseFiles([...newRows, ...knowledgeBaseFiles]);
    toast.success(
      isBuild
        ? `${newRows.length} file${newRows.length === 1 ? "" : "s"} added from library`
        : `${newRows.length} team file${newRows.length === 1 ? "" : "s"} added from library- save to attach`,
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const fileColumnCount = readOnly ? 2 : 4;
  const emptyFilesMessage = searchTerm
    ? `No files found matching "${searchTerm}"`
    : isBuild
      ? "No files added yet"
      : "No files found";

  return (
    <>
      <div className="flex flex-col">
        <div className="flex items-center justify-end mb-4 w-full min-w-0">
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
            <div className="relative flex-1 min-w-0 h-[41px] md:flex-none md:w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <CustomInput
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[41px] min-h-[41px] pl-9 pr-3 text-[12px]"
              />
            </div>
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
                            readOnly
                              ? ""
                              : "cursor-pointer hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20"
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
                              <FileText
                                size={18}
                                className="text-serene-purple shrink-0"
                              />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="font-mono text-[12px] truncate block min-w-0">
                                    {highlightMatch(item.name, searchTerm)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs break-all">
                                    {item.name}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                              <KbStatusBadge status={displayStatus(item)} />
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
                                  handleRemoveFile(
                                    item.name,
                                    Boolean(
                                      item.kb_id &&
                                      item.status !== "new" &&
                                      item.status !== "pending_attach",
                                    ),
                                  );
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
          isLoading={isLoadingFiles}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          className="mt-3 mb-4"
        />
      </div>
      <AgentKbPickFromLibraryDialog
        open={libraryDialogOpen}
        onOpenChange={setLibraryDialogOpen}
        sourceType="file"
        excludeKbIds={knowledgeBaseFiles
          .map((item) => item.kb_id)
          .filter((kbId): kbId is string => Boolean(kbId))}
        onConfirm={handleAttachFromLibrary}
      />
    </>
  );
}
