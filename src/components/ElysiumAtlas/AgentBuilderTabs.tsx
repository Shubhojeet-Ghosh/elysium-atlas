"use client";
import { User, Database, Palette, Settings } from "lucide-react";
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
    <div className="shrink-0 mt-[8px] bg-white dark:bg-[#0a0a0a]">
      <CustomTabsList className="lg:w-full">
        <CustomTabsTrigger
          value="agent"
          className="flex items-center gap-2 font-[600]"
        >
          <User size={16} />
          Agent
        </CustomTabsTrigger>
        <CustomTabsTrigger
          value="knowledgebase"
          className="flex items-center gap-2 font-[600]"
        >
          <Database size={16} />
          Knowledgebase
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
