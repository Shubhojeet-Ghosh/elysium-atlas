"use client";
import { useEffect, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  setKnowledgeBaseFiles,
  removeKnowledgeBaseFile,
} from "@/store/reducers/agentBuilderSlice";
import { FileMetadata } from "@/store/types/AgentBuilderTypes";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import Pill from "@/components/ui/Pill";
import { toast } from "sonner";
import KnowledgeBaseFilesList from "./KnowledgeBaseFilesList";
import {
  LIBRARY_REUSE_TOAST,
  resolveFileForAgentAdd,
} from "@/utils/teamKbLookup";

interface KnowledgeBaseFilesProps {
  documentFiles: File[];
  setDocumentFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export default function KnowledgeBaseFiles({
  documentFiles,
  setDocumentFiles,
}: KnowledgeBaseFilesProps) {
  const dispatch = useDispatch();
  const knowledgeBaseFiles = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseFiles,
  );

  useEffect(() => {
    setDocumentFiles((prevFiles) => {
      if (prevFiles.length === 0) return prevFiles;
      const reduxFileNames = new Set(knowledgeBaseFiles.map((f) => f.name));
      const filesToKeep = prevFiles.filter((file) =>
        reduxFileNames.has(file.name),
      );
      return filesToKeep.length !== prevFiles.length ? filesToKeep : prevFiles;
    });
  }, [knowledgeBaseFiles, setDocumentFiles]);

  const handleRemoveFile = (fileName: string) => {
    dispatch(removeKnowledgeBaseFile(fileName));
    setDocumentFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  return (
    <div className="flex flex-col">
      <SimpleFileUpload
        documentFiles={documentFiles}
        setDocumentFiles={setDocumentFiles}
        knowledgeBaseFiles={knowledgeBaseFiles}
        dispatch={dispatch}
      />
      <KnowledgeBaseFilesList onRemoveFile={handleRemoveFile} />
    </div>
  );
}

function SimpleFileUpload({
  documentFiles,
  setDocumentFiles,
  knowledgeBaseFiles,
  dispatch,
}: {
  documentFiles: File[];
  setDocumentFiles: React.Dispatch<React.SetStateAction<File[]>>;
  knowledgeBaseFiles: FileMetadata[];
  dispatch: ReturnType<typeof useDispatch>;
}) {
  const [isResolving, setIsResolving] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
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

      if (newFiles.length === 0) return;

      setIsResolving(true);
      try {
        const newRows: FileMetadata[] = [];
        const filesToStore: File[] = [];
        let libraryCount = 0;

        for (const file of newFiles) {
          const { row, reusedFromLibrary } = await resolveFileForAgentAdd(file);
          newRows.push(row);
          if (reusedFromLibrary) {
            libraryCount += 1;
          } else {
            filesToStore.push(file);
          }
        }

        dispatch(
          setKnowledgeBaseFiles([...newRows, ...knowledgeBaseFiles]),
        );

        if (filesToStore.length > 0) {
          setDocumentFiles((prev) => [...prev, ...filesToStore]);
        }

        if (libraryCount > 0) {
          toast.info(LIBRARY_REUSE_TOAST.file);
        }
        if (newRows.length - libraryCount > 0) {
          toast.success(
            `${newRows.length - libraryCount} file${newRows.length - libraryCount === 1 ? "" : "s"} added`,
          );
        }
      } finally {
        setIsResolving(false);
      }
    },
    [documentFiles, knowledgeBaseFiles, setDocumentFiles, dispatch],
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
    disabled: isResolving,
  });

  return (
    <div className="flex flex-col mt-[24px]">
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
