"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { X, Search, Trash2, FileText } from "lucide-react";
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
  toggleKnowledgeBaseFile,
  toggleAllKnowledgeBaseFiles,
  setKnowledgeBaseFiles,
} from "@/store/reducers/agentBuilderSlice";
import CustomInput from "@/components/inputs/CustomInput";
import Badge from "@/components/ui/Badge";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TablePaginationControls from "./TablePaginationControls";
import { useClientSideTablePagination } from "@/hooks/useClientSideTablePagination";

interface KnowledgeBaseFilesListProps {
  onRemoveFile: (fileName: string) => void;
}

export default function KnowledgeBaseFilesList({
  onRemoveFile,
}: KnowledgeBaseFilesListProps) {
  const dispatch = useDispatch();
  const knowledgeBaseFiles = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseFiles,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) return knowledgeBaseFiles;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return knowledgeBaseFiles.filter((item) =>
      item.name.toLowerCase().includes(lowerSearchTerm),
    );
  }, [knowledgeBaseFiles, searchTerm]);

  const {
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    total,
    pageSize,
    pageSizeOptions,
    paginatedItems: currentFiles,
    handlePageChange,
    handlePageSizeChange,
    resetPage,
  } = useClientSideTablePagination(filteredFiles);

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
  }, [currentFiles]);

  const allChecked = useMemo(() => {
    if (knowledgeBaseFiles.length === 0) return false;
    return knowledgeBaseFiles.every((item) => item.checked);
  }, [knowledgeBaseFiles]);

  const hasUnchecked = useMemo(
    () => knowledgeBaseFiles.some((item) => !item.checked),
    [knowledgeBaseFiles],
  );

  const hasChecked = useMemo(
    () => knowledgeBaseFiles.some((item) => item.checked),
    [knowledgeBaseFiles],
  );

  const checkedFilesCount = useMemo(
    () => knowledgeBaseFiles.filter((item) => item.checked).length,
    [knowledgeBaseFiles],
  );

  const handleToggleCheckbox = (index: number) => {
    dispatch(toggleKnowledgeBaseFile(index));
  };

  const handleToggleAll = () => {
    dispatch(toggleAllKnowledgeBaseFiles(!allChecked));
  };

  const handleConfirmClearSelected = () => {
    const toRemove = knowledgeBaseFiles.filter((item) => item.checked);
    const uncheckedFiles = knowledgeBaseFiles.filter((item) => !item.checked);
    dispatch(setKnowledgeBaseFiles(uncheckedFiles));
    toRemove.forEach((f) => onRemoveFile(f.name));
    setClearDialogOpen(false);
  };

  const handleRemoveFile = (fileName: string) => {
    onRemoveFile(fileName);
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const emptyMessage = searchTerm
    ? `No files found matching "${searchTerm}"`
    : "No files added yet";

  return (
    <div className="flex flex-col mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="lg:text-[14px] text-[12px] font-bold text-deep-onyx dark:text-pure-mist">
          Files ({knowledgeBaseFiles.length})
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

      <div className="flex items-center justify-between mb-3 px-[10px] flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="master-checkbox-files"
              checked={allChecked}
              onCheckedChange={handleToggleAll}
              disabled={knowledgeBaseFiles.length === 0}
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
              <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-1.5 text-[12px] font-semibold text-danger-red hover:underline cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear Selected
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Clear Selected Files</DialogTitle>
                    <DialogDescription>
                      This will remove {checkedFilesCount}{" "}
                      {checkedFilesCount === 1 ? "file" : "files"} from your
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
                    File name
                  </TableHead>
                  <TableHead className="min-w-[120px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap text-center">
                    Status
                  </TableHead>
                  <TableHead className="min-w-[120px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                    Size
                  </TableHead>
                  <TableHead className="w-[60px] text-right font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentFiles.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-[12px] text-gray-500 dark:text-gray-400"
                    >
                      {emptyMessage}
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
                        onClick={() => handleToggleCheckbox(originalIndex)}
                        className="cursor-pointer border-b border-gray-100 dark:border-deep-onyx hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20 transition-all duration-200"
                      >
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
                        <TableCell className="font-medium py-4 px-[10px] text-[14px] text-deep-onyx dark:text-pure-mist min-w-[260px]">
                          <div className="flex items-center gap-2">
                            <FileText
                              size={18}
                              className="text-serene-purple shrink-0"
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono text-[12px] truncate max-w-[280px]">
                                  {highlightMatch(item.name, searchTerm)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs break-all">{item.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[120px] py-4 px-[10px] text-center">
                          <div className="flex items-center justify-center">
                            <Badge>New</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[120px] py-4 px-[10px] text-[14px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {item.size > 0 ? formatFileSize(item.size) : "—"}
                        </TableCell>
                        <TableCell className="w-[60px] text-right py-4 px-[10px] whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(item.name);
                            }}
                            className="p-2 rounded-[8px] text-danger-red hover:bg-danger-red hover:text-white transition-colors cursor-pointer"
                            aria-label="Remove file"
                          >
                            <X size={14} />
                          </button>
                        </TableCell>
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
