"use client";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  setKnowledgeBaseFiles,
  setFileChecked,
} from "@/store/reducers/agentBuilderSlice";
import { FileMetadata } from "@/store/types/AgentBuilderTypes";
import FileDropzone from "@/components/ui/FileDropzone";

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
    (state: RootState) => state.agentBuilder.knowledgeBaseFiles
  );

  // Sync local files state with Redux store (convert File[] to FileMetadata[])
  useEffect(() => {
    const fileMetadata: FileMetadata[] = documentFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      checked: true,
      status: "new",
    }));
    dispatch(setKnowledgeBaseFiles(fileMetadata));
  }, [documentFiles, dispatch]);

  return (
    <div className="flex flex-col mt-[24px]">
      <FileDropzone
        files={documentFiles}
        setFiles={setDocumentFiles}
        onCheckedChange={(id, checked) => {
          const parts = id.split("-");
          const size = parts.pop();
          const name = parts.join("-");
          dispatch(setFileChecked({ name, checked }));
        }}
      />
    </div>
  );
}
