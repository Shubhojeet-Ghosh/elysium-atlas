"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import InviteTeamMemberDialog from "./InviteTeamMemberDialog";
import TeamMembersTable from "./TeamMembersTable";
import { fetchTeamMembers } from "@/utils/teamApi";
import type { TeamMember } from "@/types/teamMembers";
import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";
import { canManageTeamMembers } from "@/utils/teamPermissions";
import {
  DEFAULT_VISITORS_PER_PAGE,
  type VisitorPageSize,
} from "@/lib/config";

export default function TeamMembers() {
  const teamRole = useActiveTeamRole();
  const canManageMembers = canManageTeamMembers(teamRole);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentTeamSize, setCurrentTeamSize] = useState(0);
  const [maxTeamMembers, setMaxTeamMembers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(
    DEFAULT_VISITORS_PER_PAGE,
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadMembers = useCallback(async (page: number, limit: VisitorPageSize) => {
    setIsLoading(true);
    try {
      const response = await fetchTeamMembers(page, limit);

      if (!response.success) {
        toast.error(response.message || "Failed to load team members.");
        setMembers([]);
        setTotal(0);
        setTotalPages(1);
        setHasNext(false);
        setHasPrev(false);
        return;
      }

      const membersList = response.members ?? [];
      const responseTotal = response.total ?? membersList.length;
      const responseLimit = response.limit ?? limit;
      const responsePage = response.page ?? page;

      setMembers(membersList);
      setCurrentTeamSize(response.current_team_size ?? 0);
      setMaxTeamMembers(response.max_team_members ?? 0);
      setCurrentPage(responsePage);
      setTotal(responseTotal);
      setHasNext(responsePage * responseLimit < responseTotal);
      setHasPrev(responsePage > 1);
      setTotalPages(
        responseTotal > 0
          ? Math.max(1, Math.ceil(responseTotal / responseLimit))
          : 1,
      );
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to load team members.",
      );
      setMembers([]);
      setTotal(0);
      setTotalPages(1);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers(currentPage, pageSize);
  }, [currentPage, pageSize, loadMembers]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: VisitorPageSize) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleInviteSuccess = () => {
    loadMembers(currentPage, pageSize);
  };

  return (
    <div className="w-full h-full">
      <div className="flex flex-col">
        <div className="lg:text-[22px] text-[18px] font-bold flex justify-between items-center gap-4">
          <div>
            <div>Team</div>
            {maxTeamMembers > 0 && (
              <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1">
                {currentTeamSize} / {maxTeamMembers} members
              </p>
            )}
          </div>
          {canManageMembers && (
            <InviteTeamMemberDialog onInviteSuccess={handleInviteSuccess} />
          )}
        </div>

        <TeamMembersTable
          members={members}
          canManageMembers={canManageMembers}
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          total={total}
          pageSize={pageSize}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onMemberRemoved={() => loadMembers(currentPage, pageSize)}
        />
      </div>
    </div>
  );
}
