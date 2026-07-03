"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CustomTabs } from "@/components/ui/CustomTabs";
import { AgentDataSourceTabs } from "@/components/ElysiumAtlas/AgentDataSource";
import TeamKbDataSource from "@/components/ElysiumAtlas/kb/TeamKbDataSource";
import {
  KbPendingChangesProvider,
} from "@/components/ElysiumAtlas/kb/KbPendingChangesContext";
import KbPendingChangesBar from "@/components/ElysiumAtlas/kb/KbPendingChangesBar";
import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";
import { canManageTeamMembers } from "@/utils/teamPermissions";

const VALID_TABS = ["links", "files", "text", "qna"] as const;
type KbTab = (typeof VALID_TABS)[number];

function resolveActiveTab(searchParams: URLSearchParams): KbTab {
  const tab = searchParams.get("activeTab");
  if (tab && VALID_TABS.includes(tab as KbTab)) {
    return tab as KbTab;
  }
  return "links";
}

export default function KnowledgeBase() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const teamRole = useActiveTeamRole();
  const canManage = canManageTeamMembers(teamRole);
  const urlActiveTab = resolveActiveTab(searchParams);
  const [pendingTab, setPendingTab] = useState<KbTab | null>(null);
  const activeTab = pendingTab ?? urlActiveTab;
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  const handleTabChange = useCallback(
    (newTab: string) => {
      if (newTab === activeTab) return;
      setPendingTab(newTab as KbTab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("activeTab", newTab);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [activeTab, pathname, router, searchParams],
  );

  useEffect(() => {
    setPendingTab(null);
  }, [urlActiveTab]);

  useEffect(() => {
    const urlTab = searchParams.get("activeTab");
    const resolvedTab = resolveActiveTab(searchParams);
    if (urlTab !== resolvedTab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("activeTab", resolvedTab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  return (
    <KbPendingChangesProvider>
      <div className="w-full h-full">
        <div className="flex flex-col">
          <div className="lg:text-[22px] text-[18px] font-bold">
            <div>Knowledge Base</div>
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1">
              Team-level knowledge sources for your agents
            </p>
          </div>

          <CustomTabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full mt-6"
          >
            <AgentDataSourceTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </CustomTabs>

          <TeamKbDataSource
            activeTab={activeTab}
            documentFiles={documentFiles}
            setDocumentFiles={setDocumentFiles}
          />
        </div>
      </div>
      {canManage && <KbPendingChangesBar />}
    </KbPendingChangesProvider>
  );
}
