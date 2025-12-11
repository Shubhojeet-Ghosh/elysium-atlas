"use client";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setKnowledgeBaseFiles } from "@/store/reducers/agentBuilderSlice";
import CustomTextareaPrimaryCyan from "@/components/inputs/CustomTextareaPrimaryCyan";

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);

      // Store File objects in React state
      setDocumentFiles(fileArray);

      // Store file metadata in Redux
      const fileMetadata = fileArray.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }));

      dispatch(setKnowledgeBaseFiles(fileMetadata));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="lg:text-[14px] text-[12px] font-bold">
        Files <span className="text-danger-red ml-[2px]">*</span>
      </div>
      <div className="flex flex-col gap-3">
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          className="w-full px-3 py-2 text-sm border-gray-300 dark:border-deep-onyx border-2 rounded-[10px] bg-white dark:bg-deep-onyx text-deep-onyx dark:text-pure-mist cursor-pointer"
        />
        {knowledgeBaseFiles.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {knowledgeBaseFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between"
                >
                  <span>{file.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB •{" "}
                    {file.type || "Unknown type"}
                  </span>
                </div>
              ))}
            </div>
            <CustomTextareaPrimaryCyan
              placeholder="Selected files will appear here..."
              value={knowledgeBaseFiles.map((f) => f.name).join("\n")}
              readOnly
              className="w-full min-h-[150px]"
              rows={6}
            />
          </div>
        )}
      </div>
    </div>
  );
}

