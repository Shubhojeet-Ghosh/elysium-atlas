"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { useAppSelector } from "@/store";
import {
  setKnowledgeBaseFiles,
  removeKnowledgeBaseFile,
} from "@/store/reducers/agentSlice";
import {
  LIBRARY_REUSE_TOAST,
  resolveFileForAgentAdd,
} from "@/utils/teamKbLookup";
import type { FileMetadata } from "@/store/types/AgentBuilderTypes";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import Pill from "@/components/ui/Pill";
import AgentFilesList from "./AgentFilesList";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";
import { listAttachedFiles } from "@/utils/agentKbApi";
import {
  mapAttachedFilesToState,
  mergeFilesWithPending,
} from "@/utils/agentKbUtils";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import {
  readDatasourcePageSize,
  writeDatasourcePageSize,
  type VisitorPageSize,
} from "@/lib/config";
import { useAgentAttachedListLoad } from "./kb/useAgentAttachedListLoad";
import { useIsKbBuildFlow } from "./kb/KbDatasourceModeContext";
import { paginateItems } from "@/utils/agentKbUtils";
import {
  useKbFilesState,
  useKbDatasourceActions,
} from "./kb/useKbDatasourceState";

export default function AgentFiles({
  documentFiles,
  setDocumentFiles,
}: {
  documentFiles: File[];
  setDocumentFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const isBuild = useIsKbBuildFlow();
  const kbActions = useKbDatasourceActions();
  const buildFiles = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseFiles,
  );
  const dispatch = useDispatch();
  const readOnly = useAgentReadOnly();
  const agentID = useSelector((state: RootState) => state.agent.agentID);
  const knowledgeBaseFiles = useSelector(
    (state: RootState) => state.agent.knowledgeBaseFiles,
  );
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(() =>
    readDatasourcePageSize(),
  );
  const [buildPage, setBuildPage] = useState(1);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const knowledgeBaseFilesRef = useRef(knowledgeBaseFiles);
  const pageSizeRef = useRef(pageSize);
  const currentPageRef = useRef(currentPage);
  knowledgeBaseFilesRef.current = knowledgeBaseFiles;
  pageSizeRef.current = pageSize;
  currentPageRef.current = currentPage;
  const triggerFetchAgentFiles = useAppSelector(
    (state) => state.agent.triggerFetchAgentFiles,
  );
  const triggerGetAgentDetails = useAppSelector(
    (state) => state.agent.triggerGetAgentDetails,
  );

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

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

  const refreshAttachedFiles = useCallback(
    async (
      page = currentPageRef.current,
      limit = pageSizeRef.current,
      isPolling = false,
    ): Promise<boolean> => {
      if (!agentID) return false;

      if (!isPolling) setIsLoadingFiles(true);

      try {
        const response = await listAttachedFiles(agentID, page, limit);
        if (response.success) {
          const mappedFiles = mapAttachedFilesToState(response.files ?? []);
          dispatch(
            setKnowledgeBaseFiles(
              mergeFilesWithPending(mappedFiles, knowledgeBaseFilesRef.current),
            ),
          );
          applyPagination({
            total: response.total,
            page: response.page,
            total_pages: response.total_pages,
            has_next: response.has_next,
            has_prev: response.has_prev,
          });

          const hasIndexing = mappedFiles.some(
            (file) => file.status === "indexing" || file.status === "draft",
          );
          if (!hasIndexing) stopPolling();
          return hasIndexing;
        }
      } catch (error: unknown) {
        if (!isPolling) {
          toast.error(
            extractApiErrorMessage(error, "Failed to fetch agent files"),
          );
        }
        stopPolling();
      } finally {
        if (!isPolling) setIsLoadingFiles(false);
      }
      return false;
    },
    [agentID, dispatch, applyPagination],
  );

  const startPollingIfNeeded = useCallback(
    (hasIndexing: boolean) => {
      if (hasIndexing && !pollingRef.current) {
        pollingRef.current = setInterval(() => {
          refreshAttachedFiles(
            currentPageRef.current,
            pageSizeRef.current,
            true,
          );
        }, 5000);
      }
    },
    [refreshAttachedFiles],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      stopPolling();
      refreshAttachedFiles(page, pageSizeRef.current).then(
        startPollingIfNeeded,
      );
    },
    [refreshAttachedFiles, startPollingIfNeeded],
  );

  const handlePageSizeChange = useCallback(
    (size: VisitorPageSize) => {
      setPageSize(size);
      writeDatasourcePageSize(size);
      stopPolling();
      setCurrentPage(1);
      refreshAttachedFiles(1, size).then(startPollingIfNeeded);
    },
    [refreshAttachedFiles, startPollingIfNeeded],
  );

  useAgentAttachedListLoad(
    isBuild ? undefined : agentID,
    [triggerFetchAgentFiles, triggerGetAgentDetails],
    () => {
      setCurrentPage(1);
      refreshAttachedFiles(1, pageSizeRef.current).then(startPollingIfNeeded);
    },
    stopPolling,
  );

  useEffect(() => {
    if (isBuild || documentFiles.length === 0) return;

    const fileMetadata = documentFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      checked: true,
      status: "new",
      s3_key: null,
      cdn_url: null,
    }));

    const existingFileNames = new Set(knowledgeBaseFiles.map((f) => f.name));
    const newUniqueFiles = fileMetadata.filter(
      (f) => !existingFileNames.has(f.name),
    );

    if (newUniqueFiles.length > 0) {
      dispatch(
        setKnowledgeBaseFiles([...newUniqueFiles, ...knowledgeBaseFiles]),
      );
    }
  }, [documentFiles, dispatch, knowledgeBaseFiles, isBuild]);

  useEffect(() => {
    if (isBuild) return;
    setDocumentFiles((prevFiles) => {
      if (prevFiles.length === 0) return prevFiles;

      const reduxFileNames = new Set(knowledgeBaseFiles.map((f) => f.name));
      const filesToKeep = prevFiles.filter((file) =>
        reduxFileNames.has(file.name),
      );

      if (filesToKeep.length !== prevFiles.length) {
        return filesToKeep;
      }
      return prevFiles;
    });
  }, [knowledgeBaseFiles, setDocumentFiles, isBuild]);

  if (isBuild) {
    const buildPagination = paginateItems(buildFiles, buildPage, pageSize);

    return (
      <div className="flex flex-col">
        {!readOnly && (
          <SimpleFileUpload
            documentFiles={documentFiles}
            setDocumentFiles={setDocumentFiles}
            isBuild
          />
        )}
        <AgentFilesList
          isLoadingFiles={false}
          readOnly={readOnly}
          currentPage={buildPagination.totalPages > 0 ? buildPage : 1}
          totalPages={buildPagination.totalPages}
          hasNext={buildPagination.hasNext}
          hasPrev={buildPagination.hasPrev}
          total={buildPagination.total}
          pageSize={pageSize}
          onPageChange={setBuildPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            writeDatasourcePageSize(size);
            setBuildPage(1);
          }}
          onRefresh={async () => undefined}
          localPagination
          onRemoveFile={(fileName) => {
            kbActions.removeKnowledgeBaseFile(fileName);
            setDocumentFiles((prev) =>
              prev.filter((file) => file.name !== fileName),
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {!readOnly && (
        <SimpleFileUpload
          documentFiles={documentFiles}
          setDocumentFiles={setDocumentFiles}
        />
      )}
      <AgentFilesList
        isLoadingFiles={isLoadingFiles}
        readOnly={readOnly}
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrev={hasPrev}
        total={total}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={() =>
          refreshAttachedFiles(currentPageRef.current, pageSizeRef.current)
        }
        onRemoveFile={(fileName) => {
          dispatch(removeKnowledgeBaseFile(fileName));
          setDocumentFiles((prev) =>
            prev.filter((file) => file.name !== fileName),
          );
        }}
      />
    </div>
  );
}

function SimpleFileUpload({
  documentFiles,
  setDocumentFiles,
  isBuild = false,
}: {
  documentFiles: File[];
  setDocumentFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isBuild?: boolean;
}) {
  const dispatch = useDispatch();
  const kbActions = useKbDatasourceActions();
  const knowledgeBaseFiles = useKbFilesState();
  const [isResolvingFiles, setIsResolvingFiles] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const currentFileNames = new Set([
        ...documentFiles.map((f) => f.name),
        ...knowledgeBaseFiles.map((f) => f.name),
      ]);

      const candidates: File[] = [];
      acceptedFiles.forEach((file) => {
        if (currentFileNames.has(file.name)) {
          toast.error(`File "${file.name}" is already on this agent`);
        } else {
          candidates.push(file);
        }
      });

      if (candidates.length === 0) return;

      setIsResolvingFiles(true);
      try {
        const libraryRows: FileMetadata[] = [];
        const uploadFiles: File[] = [];
        let libraryCount = 0;

        for (const file of candidates) {
          const { row, reusedFromLibrary } = await resolveFileForAgentAdd(file);
          if (reusedFromLibrary) {
            libraryRows.push(row);
            libraryCount += 1;
          } else {
            uploadFiles.push(file);
          }
        }

        let nextFiles = [...knowledgeBaseFiles];

        if (libraryRows.length > 0) {
          nextFiles = [...libraryRows, ...nextFiles];
          if (libraryCount === 1) {
            toast.info(LIBRARY_REUSE_TOAST.file);
          } else {
            toast.info(
              `${libraryCount} files found in team library- will attach without re-uploading.`,
            );
          }
        }

        if (uploadFiles.length > 0) {
          const newRows: FileMetadata[] = uploadFiles.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
            checked: true,
            status: "new",
            s3_key: null,
            cdn_url: null,
          }));
          nextFiles = [...newRows, ...nextFiles];
          setDocumentFiles((prev) => [...prev, ...uploadFiles]);
          const saveLabel = isBuild ? "build" : "save";
          if (uploadFiles.length === 1 && libraryCount === 0) {
            toast.success(
              `File added- will be uploaded and indexed when you ${saveLabel}.`,
            );
          } else {
            toast.success(
              `${uploadFiles.length} new file${uploadFiles.length === 1 ? "" : "s"}- will be uploaded and indexed when you ${saveLabel}.`,
            );
          }
        }

        if (libraryRows.length > 0 || uploadFiles.length > 0) {
          kbActions.setKnowledgeBaseFiles(nextFiles);
        }
      } catch (error: unknown) {
        toast.error(
          extractApiErrorMessage(
            error,
            "Failed to check team library for files",
          ),
        );
      } finally {
        setIsResolvingFiles(false);
      }
    },
    [documentFiles, kbActions, knowledgeBaseFiles, setDocumentFiles, isBuild],
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
    <div className="flex flex-col mb-4">
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
            isResolvingFiles && "pointer-events-none opacity-60",
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
