"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { useAppSelector } from "@/store";
import {
  setKnowledgeBaseFiles,
  addKnowledgeBaseFiles,
  setFileChecked,
  removeKnowledgeBaseFile,
  setTriggerFetchAgentFiles,
} from "@/store/reducers/agentSlice";
import { FileMetadata } from "@/store/types/AgentBuilderTypes";
import { toast } from "sonner";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import Pill from "@/components/ui/Pill";
import AgentFilesList from "./AgentFilesList";

interface AgentFilesProps {
  documentFiles: File[];
  setDocumentFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export default function AgentFiles({
  documentFiles,
  setDocumentFiles,
}: AgentFilesProps) {
  const dispatch = useDispatch();
  const agentID = useSelector((state: RootState) => state.agent.agentID);
  const knowledgeBaseFiles = useSelector(
    (state: RootState) => state.agent.knowledgeBaseFiles,
  );
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggerFetchAgentFiles = useAppSelector(
    (state) => state.agent.triggerFetchAgentFiles,
  );

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const fetchAgentFiles = async (isPolling = false): Promise<boolean> => {
    if (!agentID) return false;

    if (!isPolling) setIsLoadingFiles(true);
    const token = Cookies.get("elysium_atlas_session_token");

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/get-agent-files",
        {
          agent_id: agentID,
          limit: 1000,
          cursor: null,
          include_count: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success === true) {
        const files = response.data.files?.data || [];

        const mappedFiles = files.map((fileItem: any) => ({
          name: fileItem.file_name,
          size: fileItem.file_size || 0,
          type: fileItem.file_type || "",
          checked: false,
          s3_key: fileItem.file_key,
          cdn_url: fileItem.cdn_url,
          status: fileItem.status ?? "indexed",
          updated_at: fileItem.updated_at ?? null,
        }));

        dispatch(setKnowledgeBaseFiles(mappedFiles));

        const hasIndexing = mappedFiles.some(
          (f: any) => f.status !== "indexed",
        );
        if (!hasIndexing) stopPolling();
        return hasIndexing;
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch agent files";
      if (!isPolling) toast.error(errorMessage);
      stopPolling();
    } finally {
      if (!isPolling) setIsLoadingFiles(false);
    }
    return false;
  };

  const startPollingIfNeeded = (hasIndexing: boolean) => {
    if (hasIndexing && !pollingRef.current) {
      pollingRef.current = setInterval(() => {
        fetchAgentFiles(true);
      }, 5000);
    }
  };

  useEffect(() => {
    if (!agentID) return;
    fetchAgentFiles().then(startPollingIfNeeded);
    return () => stopPolling();
  }, [agentID]);

  useEffect(() => {
    if (!agentID || triggerFetchAgentFiles === 0) return;
    stopPolling();
    fetchAgentFiles().then(startPollingIfNeeded);
  }, [triggerFetchAgentFiles]);

  // Sync local files state with Redux store (convert File[] to FileMetadata[])
  useEffect(() => {
    if (documentFiles.length > 0) {
      const fileMetadata: FileMetadata[] = documentFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        checked: true,
        status: "new",
        s3_key: null,
        cdn_url: null,
      }));

      // Get existing file names to avoid duplicates
      const existingFileNames = new Set(knowledgeBaseFiles.map((f) => f.name));

      // Filter out files that are already in Redux
      const newUniqueFiles = fileMetadata.filter(
        (f) => !existingFileNames.has(f.name),
      );

      // Add only truly new files to Redux (prepend to show them first)
      if (newUniqueFiles.length > 0) {
        dispatch(
          setKnowledgeBaseFiles([...newUniqueFiles, ...knowledgeBaseFiles]),
        );
      }
    }
  }, [documentFiles, dispatch]);

  // Reverse Sync: Ensure local documentFiles only contains files present in Redux
  // This handles external removals (like Unsaved Changes Bar clearing Redux state)
  useEffect(() => {
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
  }, [knowledgeBaseFiles]);

  return (
    <div className="flex flex-col">
      <SimpleFileUpload
        documentFiles={documentFiles}
        setDocumentFiles={setDocumentFiles}
      />
      <div className="mt-[2px]">
        <AgentFilesList
          isLoadingFiles={isLoadingFiles}
          onRemoveFile={(fileName) => {
            // Remove from Redux
            dispatch(removeKnowledgeBaseFile(fileName));

            // Remove from local state
            setDocumentFiles((prev) =>
              prev.filter((file) => file.name !== fileName),
            );
          }}
        />
      </div>
    </div>
  );
}

// Simple upload component without file display
function SimpleFileUpload({
  documentFiles,
  setDocumentFiles,
}: {
  documentFiles: File[];
  setDocumentFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const knowledgeBaseFiles = useSelector(
    (state: RootState) => state.agent.knowledgeBaseFiles,
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Create a set of all current file names (both in local state and Redux)
      const currentFileNames = new Set([
        ...documentFiles.map((f) => f.name),
        ...knowledgeBaseFiles.map((f) => f.name),
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
        setDocumentFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [documentFiles, knowledgeBaseFiles, setDocumentFiles],
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
    maxSize: 10 * 1024 * 1024, // 10 MB
  });

  return (
    <div className="flex flex-col">
      <div className="lg:text-[14px] text-[12px] font-bold mt-[4px]">
        Upload Files
      </div>
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
