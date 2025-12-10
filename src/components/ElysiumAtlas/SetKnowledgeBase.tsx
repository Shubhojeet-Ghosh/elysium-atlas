"use client";
import { useEffect, useState } from "react";
import { Network, Globe, FileText, Type } from "lucide-react";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimaryCyan from "@/components/inputs/CustomTextareaPrimaryCyan";
import PrimaryButton from "@/components/ui/PrimaryButton";
import BackButton from "@/components/ui/BackButton";
import {
  CustomTabs,
  CustomTabsContent,
  CustomTabsList,
  CustomTabsTrigger,
} from "@/components/ui/CustomTabs";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  setKnowledgeBaseSitemap,
  setKnowledgeBaseLinks,
  setKnowledgeBaseFiles,
  setKnowledgeBaseText,
  setCurrentStep,
} from "@/store/reducers/agentBuilderSlice";
import { useRouter } from "next/navigation";

interface SetKnowledgeBaseProps {
  documentFiles: File[];
  setDocumentFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export default function SetKnowledgeBase({
  documentFiles,
  setDocumentFiles,
}: SetKnowledgeBaseProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const knowledgeBaseSitemap = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseSitemap
  );
  const knowledgeBaseLinks = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseLinks
  );
  const knowledgeBaseFiles = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseFiles
  );
  const knowledgeBaseText = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseText
  );

  const [activeTab, setActiveTab] = useState("sitemap");

  const handleContinue = () => {
    dispatch(setCurrentStep(3));
  };

  const handleBack = () => {
    dispatch(setCurrentStep(1));
  };

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

  const hasContent =
    knowledgeBaseSitemap.trim() ||
    knowledgeBaseLinks.trim() ||
    knowledgeBaseFiles.length > 0 ||
    knowledgeBaseText.trim();

  return (
    <div className="flex flex-col">
      <div className="lg:text-[22px] text-[18px] font-bold flex flex-wrap items-center gap-1 md:gap-2 text-deep-onyx dark:text-pure-mist">
        Add knowledge base
      </div>
      <div className="lg:text-[16px] text-[14px] font-medium mt-1 md:mt-2 lg:mt-[4px] text-gray-500 dark:text-pure-mist">
        Provide relevant information or documents for your agent's knowledge
      </div>
      <div className="flex flex-col gap-[8px] mt-6 md:mt-8 lg:mt-[40px]">
        <div className="lg:text-[14px] text-[12px] font-bold">
          Knowledge Base <span className="text-danger-red ml-[2px]">*</span>
        </div>
        <CustomTabs
          defaultValue="sitemap"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <CustomTabsList className="lg:w-full">
            <CustomTabsTrigger
              value="sitemap"
              className="flex items-center gap-2"
            >
              <Network size={14} />
              Sitemap
            </CustomTabsTrigger>
            <CustomTabsTrigger
              value="links"
              className="flex items-center gap-2"
            >
              <Globe size={16} />
              Links
            </CustomTabsTrigger>
            <CustomTabsTrigger
              value="files"
              className="flex items-center gap-2"
            >
              <FileText size={16} />
              Files
            </CustomTabsTrigger>
            <CustomTabsTrigger value="text" className="flex items-center gap-2">
              <Type size={16} />
              Text
            </CustomTabsTrigger>
          </CustomTabsList>
          <CustomTabsContent value="sitemap">
            <div className="flex flex-col gap-3">
              <div className="lg:text-[14px] text-[12px] font-bold">
                Sitemap <span className="text-danger-red ml-[2px]">*</span>
              </div>
              <CustomTextareaPrimaryCyan
                placeholder="Enter sitemap URL (e.g., https://example.com/sitemap.xml)"
                value={knowledgeBaseSitemap}
                onChange={(e) =>
                  dispatch(setKnowledgeBaseSitemap(e.target.value))
                }
                className="w-full min-h-[200px]"
                rows={8}
              />
            </div>
          </CustomTabsContent>
          <CustomTabsContent value="links">
            <div className="flex flex-col gap-3">
              <div className="lg:text-[14px] text-[12px] font-bold">
                Links <span className="text-danger-red ml-[2px]">*</span>
              </div>
              <CustomTextareaPrimaryCyan
                placeholder="Enter URLs, one per line (e.g., https://example.com/docs)"
                value={knowledgeBaseLinks}
                onChange={(e) =>
                  dispatch(setKnowledgeBaseLinks(e.target.value))
                }
                className="w-full min-h-[200px]"
                rows={8}
              />
            </div>
          </CustomTabsContent>
          <CustomTabsContent value="files">
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
          </CustomTabsContent>
          <CustomTabsContent value="text">
            <div className="flex flex-col gap-3">
              <div className="lg:text-[14px] text-[12px] font-bold">
                Text <span className="text-danger-red ml-[2px]">*</span>
              </div>
              <CustomTextareaPrimaryCyan
                placeholder="Enter knowledge base information as text..."
                value={knowledgeBaseText}
                onChange={(e) => dispatch(setKnowledgeBaseText(e.target.value))}
                className="w-full min-h-[200px]"
                rows={8}
              />
            </div>
          </CustomTabsContent>
        </CustomTabs>
      </div>
      <div className="flex items-center justify-between mt-[30px]">
        <BackButton onClick={handleBack}>Back</BackButton>
        <PrimaryButton onClick={handleContinue} disabled={!hasContent}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
