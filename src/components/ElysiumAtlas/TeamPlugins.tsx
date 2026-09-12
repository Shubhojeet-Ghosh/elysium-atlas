"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import PluginFormDialog from "@/components/ElysiumAtlas/PluginFormDialog";
import TeamPluginsTable from "@/components/ElysiumAtlas/TeamPluginsTable";
import { fetchPlugins } from "@/utils/pluginsApi";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import type { Plugin } from "@/types/plugins";
import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";
import { canManageTeamMembers } from "@/utils/teamPermissions";
import {
  DEFAULT_VISITORS_PER_PAGE,
  type VisitorPageSize,
} from "@/lib/config";

export default function TeamPlugins() {
  const teamRole = useActiveTeamRole();
  const canManagePlugins = canManageTeamMembers(teamRole);

  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(
    DEFAULT_VISITORS_PER_PAGE,
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadPlugins = useCallback(
    async (page: number, limit: VisitorPageSize) => {
      setIsLoading(true);
      try {
        const response = await fetchPlugins(page, limit, true);

        if (!response.success) {
          toast.error(response.message || "Failed to load plugins.");
          setPlugins([]);
          setTotal(0);
          setTotalPages(1);
          setHasNext(false);
          setHasPrev(false);
          return;
        }

        const pluginsList = response.plugins ?? [];
        const responseTotal = response.total ?? pluginsList.length;
        const responseLimit = response.limit ?? limit;
        const responsePage = response.page ?? page;

        setPlugins(pluginsList);
        setCurrentPage(responsePage);
        setTotal(responseTotal);
        setHasNext(
          response.has_next ?? responsePage * responseLimit < responseTotal,
        );
        setHasPrev(response.has_prev ?? responsePage > 1);
        setTotalPages(
          response.total_pages ??
            (responseTotal > 0
              ? Math.max(1, Math.ceil(responseTotal / responseLimit))
              : 1),
        );
      } catch (error: unknown) {
        toast.error(extractApiErrorMessage(error, "Failed to load plugins."));
        setPlugins([]);
        setTotal(0);
        setTotalPages(1);
        setHasNext(false);
        setHasPrev(false);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadPlugins(currentPage, pageSize);
  }, [currentPage, pageSize, loadPlugins]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: VisitorPageSize) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handlePluginChanged = () => {
    loadPlugins(currentPage, pageSize);
  };

  return (
    <div className="w-full h-full">
      <div className="flex flex-col">
        <div className="lg:text-[22px] text-[18px] font-bold flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 lg:gap-4">
          <div>
            <div>Plugins</div>
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1">
              Team-level Python functions the AI can call like tools
            </p>
          </div>
          {canManagePlugins && (
            <div className="w-full lg:w-auto shrink-0 flex justify-end">
              <PluginFormDialog
                mode="create"
                onSuccess={handlePluginChanged}
              />
            </div>
          )}
        </div>

        <TeamPluginsTable
          plugins={plugins}
          canManagePlugins={canManagePlugins}
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          total={total}
          pageSize={pageSize}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onPluginChanged={handlePluginChanged}
        />
      </div>
    </div>
  );
}
