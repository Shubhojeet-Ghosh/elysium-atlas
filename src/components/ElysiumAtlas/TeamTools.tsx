"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ToolFormDialog from "@/components/ElysiumAtlas/ToolFormDialog";
import TeamToolsTable from "@/components/ElysiumAtlas/TeamToolsTable";
import { fetchTools } from "@/utils/toolsApi";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import type { Tool } from "@/types/tools";
import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";
import { canManageTeamMembers } from "@/utils/teamPermissions";
import {
  DEFAULT_VISITORS_PER_PAGE,
  type VisitorPageSize,
} from "@/lib/config";

export default function TeamTools() {
  const teamRole = useActiveTeamRole();
  const canManageTools = canManageTeamMembers(teamRole);

  const [tools, setTools] = useState<Tool[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(
    DEFAULT_VISITORS_PER_PAGE,
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadTools = useCallback(async (page: number, limit: VisitorPageSize) => {
    setIsLoading(true);
    try {
      const response = await fetchTools(page, limit, true);

      if (!response.success) {
        toast.error(response.message || "Failed to load tools.");
        setTools([]);
        setTotal(0);
        setTotalPages(1);
        setHasNext(false);
        setHasPrev(false);
        return;
      }

      const toolsList = response.tools ?? [];
      const responseTotal = response.total ?? toolsList.length;
      const responseLimit = response.limit ?? limit;
      const responsePage = response.page ?? page;

      setTools(toolsList);
      setCurrentPage(responsePage);
      setTotal(responseTotal);
      setHasNext(response.has_next ?? responsePage * responseLimit < responseTotal);
      setHasPrev(response.has_prev ?? responsePage > 1);
      setTotalPages(
        response.total_pages ??
          (responseTotal > 0
            ? Math.max(1, Math.ceil(responseTotal / responseLimit))
            : 1),
      );
    } catch (error: unknown) {
      toast.error(extractApiErrorMessage(error, "Failed to load tools."));
      setTools([]);
      setTotal(0);
      setTotalPages(1);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTools(currentPage, pageSize);
  }, [currentPage, pageSize, loadTools]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: VisitorPageSize) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleToolChanged = () => {
    loadTools(currentPage, pageSize);
  };

  return (
    <div className="w-full h-full">
      <div className="flex flex-col">
        <div className="lg:text-[22px] text-[18px] font-bold flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 lg:gap-4">
          <div>
            <div>Tools</div>
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1">
              Team-level HTTP integrations the AI can call
            </p>
          </div>
          {canManageTools && (
            <div className="w-full lg:w-auto shrink-0 flex justify-end">
              <ToolFormDialog mode="create" onSuccess={handleToolChanged} />
            </div>
          )}
        </div>

        <TeamToolsTable
          tools={tools}
          canManageTools={canManageTools}
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          total={total}
          pageSize={pageSize}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onToolChanged={handleToolChanged}
        />
      </div>
    </div>
  );
}
