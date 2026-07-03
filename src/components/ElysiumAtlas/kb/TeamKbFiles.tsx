"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Pill from "@/components/ui/Pill";
import TeamKbFilesList from "./TeamKbFilesList";
import { useKbListPolling } from "./useKbListPolling";
import { useKbPendingRegistration } from "./KbPendingChangesContext";
import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";
import { canManageTeamMembers } from "@/utils/teamPermissions";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import {
  createFile,
  finalizeFile,
  generatePresignedUrls,
  listFiles,
  parseKbPresignedUrls,
  searchKbItems,
} from "@/utils/kbItemsApi";
import type { KbFileItem, KbItemStatus } from "@/types/kbItems";
import {
  readDatasourcePageSize,
  writeDatasourcePageSize,
  VISITOR_PAGE_SIZE_OPTIONS,
  type VisitorPageSize,
} from "@/lib/config";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export interface KbFileDisplayItem {
  kb_id: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  status: KbItemStatus | "new";
  updated_at?: string | null;
  checked: boolean;
}

function mapApiFile(fileItem: KbFileItem): KbFileDisplayItem {
  return {
    kb_id: fileItem.kb_id,
    file_name: fileItem.file_name,
    file_size: fileItem.file_size ?? 0,
    file_type: fileItem.file_type ?? "",
    status: fileItem.status,
    updated_at: fileItem.updated_at ?? null,
    checked: false,
  };
}

interface TeamKbFilesProps {
  documentFiles: File[];
  setDocumentFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export default function TeamKbFiles({
  documentFiles,
  setDocumentFiles,
}: TeamKbFilesProps) {
  const teamRole = useActiveTeamRole();
  const readOnly = !canManageTeamMembers(teamRole);

  const [files, setFiles] = useState<KbFileDisplayItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(() =>
    readDatasourcePageSize(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const pageSizeRef = useRef(pageSize);
  const currentPageRef = useRef(currentPage);
  const filesRef = useRef(files);
  const documentFilesRef = useRef(documentFiles);
  const searchQueryRef = useRef(debouncedSearchQuery);
  const uploadingRef = useRef<Set<string>>(new Set());

  pageSizeRef.current = pageSize;
  currentPageRef.current = currentPage;
  filesRef.current = files;
  documentFilesRef.current = documentFiles;
  searchQueryRef.current = debouncedSearchQuery.trim();

  const mergeWithNewFiles = useCallback(
    (mappedFiles: KbFileDisplayItem[], activeSearch: string) => {
      if (activeSearch) {
        return mappedFiles;
      }

      const fetchedNames = new Set(mappedFiles.map((f) => f.file_name));
      const newItems = filesRef.current.filter(
        (item) => item.status === "new" && !fetchedNames.has(item.file_name),
      );

      return [...newItems, ...mappedFiles];
    },
    [],
  );

  const applyPagination = useCallback(
    (payload: {
      total: number;
      page: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    }) => {
      setCurrentPage(payload.page);
      setTotal(payload.total);
      setHasNext(payload.has_next);
      setHasPrev(payload.has_prev);
      setTotalPages(
        payload.total_pages > 0
          ? payload.total_pages
          : payload.total > 0
            ? Math.max(1, Math.ceil(payload.total / pageSizeRef.current))
            : 0,
      );
    },
    [],
  );

  const needsPolling = useCallback((items: KbFileDisplayItem[]) => {
    return items.some(
      (f) => f.status === "indexing" || f.status === "draft",
    );
  }, []);

  const fetchFiles = useCallback(
    async (
      page = currentPageRef.current,
      limit = pageSizeRef.current,
      isPolling = false,
    ): Promise<boolean> => {
      if (!isPolling) setIsLoadingFiles(true);

      const activeSearch = searchQueryRef.current;

      try {
        const response = activeSearch
          ? await searchKbItems("file", activeSearch, page, limit)
          : await listFiles(page, limit);

        if (response.success === true) {
          const mappedFiles = (response.files || []).map(mapApiFile);
          setFiles(mergeWithNewFiles(mappedFiles, activeSearch));
          applyPagination({
            total: response.total ?? 0,
            page: response.page ?? page,
            total_pages: response.total_pages ?? 0,
            has_next: response.has_next ?? false,
            has_prev: response.has_prev ?? false,
          });

          const hasActive =
            !activeSearch && needsPolling(mappedFiles);
          return hasActive;
        }
      } catch (error: unknown) {
        if (!isPolling) {
          toast.error(extractApiErrorMessage(error, "Failed to fetch files"));
        }
      } finally {
        if (!isPolling) setIsLoadingFiles(false);
      }
      return false;
    },
    [applyPagination, mergeWithNewFiles, needsPolling],
  );

  const { refresh, stopPolling, startPollingIfNeeded } = useKbListPolling(
    async (isPolling) => {
      const hasActive = await fetchFiles(
        currentPageRef.current,
        pageSizeRef.current,
        isPolling,
      );
      if (!hasActive) stopPolling();
      return hasActive;
    },
    [],
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      stopPolling();
      setFiles((prev) => prev.filter((item) => item.status === "new"));
      if (!query.trim()) {
        setCurrentPage(1);
      }
    },
    [stopPolling],
  );

  const prevDebouncedSearchRef = useRef(debouncedSearchQuery);
  useEffect(() => {
    if (prevDebouncedSearchRef.current === debouncedSearchQuery) return;
    prevDebouncedSearchRef.current = debouncedSearchQuery;

    stopPolling();
    setCurrentPage(1);
    fetchFiles(1, pageSizeRef.current).then((hasActive) => {
      if (!searchQueryRef.current) {
        startPollingIfNeeded(hasActive);
      }
    });
  }, [debouncedSearchQuery, fetchFiles, startPollingIfNeeded, stopPolling]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (uploadingRef.current.has(file.name)) return;
      uploadingRef.current.add(file.name);

      setFiles((prev) => {
        if (prev.some((f) => f.file_name === file.name)) return prev;
        return [
          {
            kb_id: "",
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            status: "new" as const,
            checked: true,
            updated_at: null,
          },
          ...prev,
        ];
      });

      try {
        const createRes = await createFile(file.name);
        if (!createRes.success || !createRes.kb_id) {
          throw new Error(createRes.message || "Failed to create file record");
        }

        const kbId = createRes.kb_id;
        const presignedRes = await generatePresignedUrls(kbId, [
          {
            file_name: file.name,
            filetype: file.type || "application/octet-stream",
          },
        ]);

        if (!presignedRes.success) {
          throw new Error(
            presignedRes.message || "Failed to generate presigned URL",
          );
        }

        const presignedFiles = parseKbPresignedUrls(presignedRes);
        const presignedFile =
          presignedFiles.find((entry) => entry.file_name === file.name) ??
          presignedFiles[0];

        if (!presignedFile?.upload_url || !presignedFile?.file_key) {
          throw new Error(
            presignedRes.message || "No presigned URL returned",
          );
        }

        await axios.put(presignedFile.upload_url, file, {
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        });

        const finalizeRes = await finalizeFile(kbId, presignedFile.file_key);
        if (finalizeRes.success === false) {
          throw new Error(finalizeRes.message || "Failed to finalize file");
        }

        toast.success(`"${file.name}" uploaded successfully`);
      } catch (error: unknown) {
        toast.error(
          extractApiErrorMessage(error, `Failed to upload "${file.name}"`),
        );
        setFiles((prev) =>
          prev.filter(
            (f) => !(f.file_name === file.name && f.status === "new"),
          ),
        );
      } finally {
        uploadingRef.current.delete(file.name);
        setDocumentFiles((prev) => prev.filter((f) => f.name !== file.name));
        stopPolling();
        const hasActive = await fetchFiles(
          currentPageRef.current,
          pageSizeRef.current,
        );
        startPollingIfNeeded(hasActive);
      }
    },
    [fetchFiles, setDocumentFiles, startPollingIfNeeded, stopPolling],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      stopPolling();
      fetchFiles(page, pageSizeRef.current).then(startPollingIfNeeded);
    },
    [fetchFiles, startPollingIfNeeded, stopPolling],
  );

  const handlePageSizeChange = useCallback(
    (size: VisitorPageSize) => {
      setPageSize(size);
      writeDatasourcePageSize(size);
      stopPolling();
      setCurrentPage(1);
      fetchFiles(1, size).then(startPollingIfNeeded);
    },
    [fetchFiles, startPollingIfNeeded, stopPolling],
  );

  const handleRemoveFile = useCallback(
    (fileName: string) => {
      setFiles((prev) => prev.filter((f) => f.file_name !== fileName));
      setDocumentFiles((prev) => prev.filter((f) => f.name !== fileName));
    },
    [setDocumentFiles],
  );

  const getCheckedPendingFiles = useCallback(
    () =>
      filesRef.current.filter((f) => f.status === "new" && f.checked),
    [],
  );

  const indexPendingFiles = useCallback(async () => {
    const pendingNames = getCheckedPendingFiles().map((f) => f.file_name);

    for (const fileName of pendingNames) {
      const file = documentFilesRef.current.find((f) => f.name === fileName);
      if (file) {
        await uploadFile(file);
      }
    }
  }, [getCheckedPendingFiles, uploadFile]);

  const clearPendingFiles = useCallback(() => {
    setFiles((prev) => prev.filter((f) => f.status !== "new"));
    setDocumentFiles([]);
  }, [setDocumentFiles]);

  const notifyPendingChange = useKbPendingRegistration(
    "files",
    {
      hasPending: () => getCheckedPendingFiles().length > 0,
      getPendingCount: () => getCheckedPendingFiles().length,
      onIndex: indexPendingFiles,
      onClear: clearPendingFiles,
    },
    [files, documentFiles, indexPendingFiles, clearPendingFiles, getCheckedPendingFiles],
  );

  useEffect(() => {
    notifyPendingChange();
  }, [files, documentFiles, notifyPendingChange]);

  useEffect(() => {
    setDocumentFiles((prevFiles) => {
      if (prevFiles.length === 0) return prevFiles;

      const fileNames = new Set(files.map((f) => f.file_name));
      const filesToKeep = prevFiles.filter((file) => fileNames.has(file.name));

      if (filesToKeep.length !== prevFiles.length) {
        return filesToKeep;
      }
      return prevFiles;
    });
  }, [files, setDocumentFiles]);

  return (
    <div className="flex flex-col">
      {!readOnly && (
        <KbFileUpload
          documentFiles={documentFiles}
          files={files}
          onAddFiles={(newFiles) => {
            setDocumentFiles((prev) => [...prev, ...newFiles]);
            setFiles((prev) => {
              const existingNames = new Set(prev.map((f) => f.file_name));
              const pendingRows: KbFileDisplayItem[] = newFiles
                .filter((file) => !existingNames.has(file.name))
                .map((file) => ({
                  kb_id: "",
                  file_name: file.name,
                  file_size: file.size,
                  file_type: file.type,
                  status: "new" as const,
                  checked: true,
                  updated_at: null,
                }));
              return [...pendingRows, ...prev];
            });
          }}
        />
      )}
      <div className="mt-5">
        <TeamKbFilesList
          files={files}
          setFiles={setFiles}
          searchQuery={searchQuery}
          debouncedSearchQuery={debouncedSearchQuery}
          onSearchChange={handleSearchChange}
          isSearchActive={Boolean(debouncedSearchQuery.trim())}
          isLoadingFiles={isLoadingFiles}
          readOnly={readOnly}
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          total={total}
          pageSize={pageSize}
          pageSizeOptions={VISITOR_PAGE_SIZE_OPTIONS}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onRemoveFile={handleRemoveFile}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
}

function KbFileUpload({
  documentFiles,
  files,
  onAddFiles,
}: {
  documentFiles: File[];
  files: KbFileDisplayItem[];
  onAddFiles: (files: File[]) => void;
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const currentFileNames = new Set([
        ...documentFiles.map((f) => f.name),
        ...files.map((f) => f.file_name),
      ]);

      const newFiles: File[] = [];

      acceptedFiles.forEach((file) => {
        if (currentFileNames.has(file.name)) {
          toast.error(`File "${file.name}" already exists`);
        } else {
          newFiles.push(file);
        }
      });

      if (newFiles.length > 0) {
        onAddFiles(newFiles);
      }
    },
    [documentFiles, files, onAddFiles],
  );

  const onDropRejected = useCallback((fileRejections: any[]) => {
    fileRejections.forEach((rejection) => {
      if (rejection.errors.some((e: any) => e.code === "file-too-large")) {
        toast.error(`${rejection.file.name} exceeds the 10 MB size limit`);
      } else if (
        rejection.errors.some((e: any) => e.code === "file-invalid-type")
      ) {
        toast.error(`${rejection.file.name} is not a supported file type`);
      } else {
        toast.error(`Failed to add ${rejection.file.name}`);
      }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <div className="flex flex-col">
      <div className="mt-[4px]">
        <div
          {...getRootProps()}
          className={cn(
            "border-[2px] border-dashed rounded-[12px] p-8 text-center cursor-pointer transition-all duration-300 ease-in-out",
            "border-gray-300 dark:border-white",
            "hover:border-serene-purple dark:hover:border-serene-purple",
            isDragActive &&
              "border-serene-purple dark:border-teal-green bg-serene-purple/5 dark:bg-teal-green/10",
            "bg-white dark:bg-deep-onyx",
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
                  : "text-gray-400 dark:text-gray-500",
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
      </div>
    </div>
  );
}
