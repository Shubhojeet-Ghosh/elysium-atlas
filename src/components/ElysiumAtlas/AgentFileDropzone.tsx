"use client";
import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import {
  Upload,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
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
import PrimaryButton from "@/components/ui/PrimaryButton";
import Pill from "@/components/ui/Pill";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface FileWithChecked {
  file: File;
  checked: boolean;
  id: string; // unique identifier: name-size
}

interface AgentFileDropzoneProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  accept?: {
    [key: string]: string[];
  };
  maxFiles?: number;
  className?: string;
  onCheckedChange?: (id: string, checked: boolean) => void;
}

const FILES_PER_PAGE = 6; // 3 rows × 2 columns

export default function AgentFileDropzone({
  files,
  setFiles,
  accept = {
    "application/pdf": [".pdf"],
    "text/plain": [".txt"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
  },
  maxFiles,
  className,
  onCheckedChange,
}: AgentFileDropzoneProps) {
  // Convert files to FileWithChecked structure
  const [filesWithChecked, setFilesWithChecked] = useState<FileWithChecked[]>(
    []
  );
  const checkedStateRef = useRef<Map<string, boolean>>(new Map());

  // Sync files prop to internal state
  useEffect(() => {
    const newFilesWithChecked: FileWithChecked[] = files.map((file) => {
      const id = `${file.name}-${file.size}`;
      return {
        file,
        checked: checkedStateRef.current.get(id) ?? true, // Default to checked
        id,
      };
    });

    // Update the checked state ref
    newFilesWithChecked.forEach((item) => {
      checkedStateRef.current.set(item.id, item.checked);
    });

    setFilesWithChecked(newFilesWithChecked);
  }, [files]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (maxFiles && files.length + acceptedFiles.length > maxFiles) {
        return;
      }

      // Filter out duplicates by name and size
      const existingFilesSet = new Set(
        files.map((file) => `${file.name}-${file.size}`)
      );
      const newFiles = acceptedFiles.filter(
        (file) => !existingFilesSet.has(`${file.name}-${file.size}`)
      );

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files, setFiles, maxFiles]
  );

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    fileRejections.forEach((rejection) => {
      if (rejection.errors.some((e) => e.code === "file-too-large")) {
        toast.error(`${rejection.file.name} exceeds the 10 MB size limit`);
      } else if (rejection.errors.some((e) => e.code === "file-invalid-type")) {
        toast.error(`${rejection.file.name} is not a supported file type`);
      } else {
        toast.error(`Failed to add ${rejection.file.name}`);
      }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept,
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10 MB
  });

  // Filter files based on search term
  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) {
      return filesWithChecked;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return filesWithChecked.filter((item) =>
      item.file.name.toLowerCase().includes(lowerSearchTerm)
    );
  }, [filesWithChecked, searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredFiles.length / FILES_PER_PAGE);
  const startIndex = (currentPage - 1) * FILES_PER_PAGE;
  const endIndex = startIndex + FILES_PER_PAGE;
  const currentFiles = filteredFiles.slice(startIndex, endIndex);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Calculate if all files are checked
  const allChecked = useMemo(() => {
    if (filesWithChecked.length === 0) return false;
    return filesWithChecked.every((item) => item.checked);
  }, [filesWithChecked]);

  // Calculate if at least one is unchecked
  const hasUnchecked = useMemo(() => {
    return filesWithChecked.some((item) => !item.checked);
  }, [filesWithChecked]);

  // Calculate if any files are checked (for showing Clear Selected)
  const hasChecked = useMemo(() => {
    return filesWithChecked.some((item) => item.checked);
  }, [filesWithChecked]);

  // Count checked files
  const checkedFilesCount = useMemo(() => {
    return filesWithChecked.filter((item) => item.checked).length;
  }, [filesWithChecked]);

  const removeFile = (fileToRemove: File) => {
    const idToRemove = `${fileToRemove.name}-${fileToRemove.size}`;
    checkedStateRef.current.delete(idToRemove);
    setFiles((prev) =>
      prev.filter((file) => `${file.name}-${file.size}` !== idToRemove)
    );
  };

  const handleToggleCheckbox = (id: string) => {
    let newChecked: boolean;
    setFilesWithChecked((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          newChecked = !item.checked;
          checkedStateRef.current.set(id, newChecked);
          return { ...item, checked: newChecked };
        }
        return item;
      })
    );
    onCheckedChange?.(id, newChecked!);
  };

  const handleToggleAll = () => {
    const newCheckedState = !allChecked;
    setFilesWithChecked((prev) => {
      const updated = prev.map((item) => {
        checkedStateRef.current.set(item.id, newCheckedState);
        return { ...item, checked: newCheckedState };
      });
      updated.forEach((item) => onCheckedChange?.(item.id, newCheckedState));
      return updated;
    });
  };

  const handleClearSelected = () => {
    setClearDialogOpen(true);
  };

  const handleConfirmClearSelected = () => {
    // Remove all checked files
    const uncheckedFiles = filesWithChecked
      .filter((item) => !item.checked)
      .map((item) => item.file);

    // Clean up checked state ref for removed files
    const keptIds = new Set(uncheckedFiles.map((f) => `${f.name}-${f.size}`));
    checkedStateRef.current.forEach((_, id) => {
      if (!keptIds.has(id)) {
        checkedStateRef.current.delete(id);
      }
    });

    setFiles(uncheckedFiles);
    setClearDialogOpen(false);
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

  const getFileIcon = (fileName: string) => {
    return <FileText size={20} className="text-serene-purple" />;
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-[2px] border-dashed rounded-[12px] p-8 text-center cursor-pointer transition-all duration-300 ease-in-out",
          "border-gray-300 dark:border-white",
          "hover:border-serene-purple dark:hover:border-serene-purple",
          isDragActive &&
            "border-serene-purple dark:border-teal-green bg-serene-purple/5 dark:bg-teal-green/10",
          "bg-white dark:bg-deep-onyx"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
          <Upload
            size={26}
            className={cn(
              "transition-colors duration-300",
              isDragActive
                ? "text-serene-purple dark:text-teal-green"
                : "text-gray-400 dark:text-gray-500"
            )}
          />
          <span className="text-[14px] font-[500] text-deep-onyx dark:text-pure-mist mt-3">
            {isDragActive
              ? "Drop files here"
              : "Drag & drop files here, or click to select"}
          </span>
          <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-[2px]">
            Up to 10 MB each file.
          </span>
          <div className="flex items-center gap-2 mt-[8px]">
            <Pill item="pdf" />
            <Pill item="txt" />
            <Pill item="docx" />
          </div>
        </div>
      </div>

      {filesWithChecked.length > 0 && (
        <div className="flex flex-col mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="lg:text-[14px] text-[12px] font-bold text-deep-onyx dark:text-pure-mist">
              Files Found ({filesWithChecked.length})
              {searchTerm && (
                <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                  ({filteredFiles.length} found)
                </span>
              )}
            </div>
            {filesWithChecked.length > 0 && (
              <div className="relative w-[200px]">
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
                        Clear Selected
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

          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-[12px]">
              No files found matching "{searchTerm}"
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {currentFiles.map((item) => {
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleCheckbox(item.id)}
                    className="group flex items-center justify-between gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 w-full cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Checkbox
                        id={`file-${item.id}`}
                        checked={item.checked}
                        onCheckedChange={() => handleToggleCheckbox(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 border-2 border-gray-300 dark:border-gray-500 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(item.file.name)}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-mono text-[12px] text-gray-700 dark:text-gray-300 truncate cursor-default">
                                {highlightMatch(item.file.name, searchTerm)}
                              </span>
                              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                {formatFileSize(item.file.size)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs break-all">
                              {item.file.name}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(item.file);
                        }}
                        className="group/btn p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                        aria-label="Remove file"
                      >
                        <X className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 group-hover/btn:text-danger-red transition-colors" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
