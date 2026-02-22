"use client";
import {
  User,
  Database,
  Palette,
  Settings,
  Globe,
  FileText,
  Type,
  MessagesSquare,
} from "lucide-react";
import {
  CustomTabs,
  CustomTabsList,
  CustomTabsTrigger,
} from "@/components/ui/CustomTabs";

interface AgentBuilderTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export default function AgentBuilderTabs({
  activeTab,
  onTabChange,
}: AgentBuilderTabsProps) {
  return (
    <div className="mt-[8px] bg-white dark:bg-[#0a0a0a]">
      <CustomTabsList className="lg:w-full">
        <CustomTabsTrigger
          value="agent"
          className="flex items-center gap-2 font-[600]"
        >
          <User size={16} />
          Agent
        </CustomTabsTrigger>
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
        <CustomTabsTrigger
          value="personalize"
          className="flex items-center gap-2 font-[600]"
        >
          <Palette size={16} />
          Personalize
        </CustomTabsTrigger>
        <CustomTabsTrigger
          value="advanced"
          className="flex items-center gap-2 font-[600]"
        >
          <Settings size={16} />
          Advanced
        </CustomTabsTrigger>
      </CustomTabsList>
    </div>
  );
}
