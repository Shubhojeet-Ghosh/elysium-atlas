"use client";
import { Globe, FileText, Type, MessagesSquare } from "lucide-react";
import {
  CustomTabsList,
  CustomTabsTrigger,
} from "@/components/ui/CustomTabs";
import AgentLinks from "./AgentLinks";
import AgentFiles from "./AgentFiles";
import AgentText from "./AgentText";
import AgentQnA from "./AgentQnA";

interface AgentDataSourceTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function AgentDataSourceTabs({
  activeTab,
  onTabChange,
}: AgentDataSourceTabsProps) {
  return (
    <div className="bg-white dark:bg-[#0a0a0a]">
      <CustomTabsList className="lg:w-full">
        <CustomTabsTrigger
          value="links"
          className="flex items-center gap-2 font-[600]"
        >
          <Globe size={16} />
          Links
        </CustomTabsTrigger>
        <CustomTabsTrigger
          value="files"
          className="flex items-center gap-2 font-[600]"
        >
          <FileText size={16} />
          Files
        </CustomTabsTrigger>
        <CustomTabsTrigger
          value="text"
          className="flex items-center gap-2 font-[600]"
        >
          <Type size={16} />
          Text
        </CustomTabsTrigger>
        <CustomTabsTrigger
          value="qna"
          className="flex items-center gap-2 font-[600]"
        >
          <MessagesSquare size={16} />
          QnA
        </CustomTabsTrigger>
      </CustomTabsList>
    </div>
  );
}

interface AgentDataSourceProps {
  activeTab: string;
  documentFiles: File[];
  setDocumentFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export default function AgentDataSource({
  activeTab,
  documentFiles,
  setDocumentFiles,
}: AgentDataSourceProps) {
  return (
    <div className="mt-4 pb-4 md:pb-6">
      {activeTab === "links" && <AgentLinks />}
      {activeTab === "files" && (
        <AgentFiles
          documentFiles={documentFiles}
          setDocumentFiles={setDocumentFiles}
        />
      )}
      {activeTab === "text" && <AgentText />}
      {activeTab === "qna" && <AgentQnA />}
    </div>
  );
}
