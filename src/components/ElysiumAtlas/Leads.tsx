"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NProgress from "nprogress";
import { toast } from "sonner";
import Cookies from "js-cookie";
import AutoComplete from "@/components/ui/AutoComplete";
import LeadsTable from "@/components/ElysiumAtlas/LeadsTable";
import { useAppDispatch, useAppSelector } from "@/store";
import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";
import { listTeamLeads } from "@/utils/leadCollectionApi";
import { captureChatSession } from "@/utils/chatSessionListUtils";
import fastApiAxios from "@/utils/fastapi_axios";
import type { TeamLeadListItem } from "@/types/leadCollection";
import {
  readVisitorsPageSize,
  VISITOR_PAGE_SIZE_OPTIONS,
  writeVisitorsPageSize,
  type VisitorPageSize,
} from "@/lib/config";

type AgentOption = {
  agent_id: string;
  agent_name: string;
};

const ALL_AGENTS_VALUE = "__all__";

export default function Leads() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userID = useAppSelector((state) => state.userProfile.userID);
  const teamRole = useActiveTeamRole();

  const [leads, setLeads] = useState<TeamLeadListItem[]>([]);
  const [agentOptions, setAgentOptions] = useState<AgentOption[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(ALL_AGENTS_VALUE);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(() =>
    readVisitorsPageSize(),
  );
  const [isLoading, setIsLoading] = useState(true);

  const agentNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const agent of agentOptions) {
      map[agent.agent_id] = agent.agent_name;
    }
    return map;
  }, [agentOptions]);

  const agentFilterItems = useMemo(
    () => [
      { value: ALL_AGENTS_VALUE, label: "All agents" },
      ...agentOptions.map((agent) => ({
        value: agent.agent_id,
        label: agent.agent_name,
      })),
    ],
    [agentOptions],
  );

  const loadAgentOptions = useCallback(async () => {
    const token = Cookies.get("elysium_atlas_session_token");
    if (!token) {
      setAgentOptions([]);
      return;
    }

    try {
      const res = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/list-agents",
        { page: 1, limit: 100 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data?.success && Array.isArray(res.data.agents)) {
        setAgentOptions(
          res.data.agents.map((agent: AgentOption) => ({
            agent_id: agent.agent_id,
            agent_name: agent.agent_name,
          })),
        );
      }
    } catch {
      setAgentOptions([]);
    }
  }, []);

  const loadLeads = useCallback(
    async (page: number, limit: VisitorPageSize, agentId?: string) => {
      setIsLoading(true);

      try {
        const response = await listTeamLeads({
          page,
          limit,
          ...(agentId ? { agent_id: agentId } : {}),
        });

        if (!response.success) {
          toast.error(response.message || "Failed to load leads.");
          setLeads([]);
          setTotal(0);
          setTotalPages(1);
          setHasNext(false);
          setHasPrev(false);
          return;
        }

        const leadsList = Array.isArray(response.leads) ? response.leads : [];
        const responseTotal = response.total ?? leadsList.length;
        const responseLimit = response.limit ?? limit;
        const responsePage = response.page ?? page;

        setLeads(leadsList);
        setCurrentPage(responsePage);
        setTotal(responseTotal);
        setTotalPages(
          response.total_pages ??
            (responseTotal > 0
              ? Math.max(1, Math.ceil(responseTotal / responseLimit))
              : 1),
        );
        setHasNext(response.has_next ?? responsePage * responseLimit < responseTotal);
        setHasPrev(response.has_prev ?? responsePage > 1);
      } catch (error: unknown) {
        const err = error as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        toast.error(
          err.response?.data?.message ||
            err.message ||
            "Failed to load leads.",
        );
        setLeads([]);
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
    loadAgentOptions();
  }, [loadAgentOptions]);

  useEffect(() => {
    const agentId =
      selectedAgentId === ALL_AGENTS_VALUE ? undefined : selectedAgentId;
    loadLeads(currentPage, pageSize, agentId);
  }, [currentPage, pageSize, selectedAgentId, loadLeads]);

  const handleAgentFilterChange = (value: string) => {
    setSelectedAgentId(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: VisitorPageSize) => {
    writeVisitorsPageSize(size);
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleLeadClick = useCallback(
    (lead: TeamLeadListItem) => {
      if (!userID) return;

      NProgress.start();
      captureChatSession(dispatch, {
        agent_id: lead.agent_id,
        user_id: userID,
        chat_session_id: lead.chat_session_id,
        team_role: teamRole,
      });
      router.push(
        `/my-agents/${lead.agent_id}?section=live-visitors`,
      );
    },
    [dispatch, router, teamRole, userID],
  );

  return (
    <div className="w-full h-full">
      <div className="flex flex-col">
        <div className="lg:text-[22px] text-[18px] font-bold">
          <div>Leads</div>
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1">
            Contact details captured from your agents&apos; chat sessions.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <div className="w-full max-w-[220px] lg:max-w-[260px]">
          <AutoComplete
            items={agentFilterItems}
            value={selectedAgentId}
            placeholder="All agents"
            searchPlaceholder="Search agent..."
            emptyMessage="No agent found."
            onChange={handleAgentFilterChange}
            className="text-[13px] font-[500]"
          />
        </div>
      </div>

      <LeadsTable
        leads={leads}
        agentNameById={agentNameById}
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrev={hasPrev}
        total={total}
        pageSize={pageSize}
        pageSizeOptions={VISITOR_PAGE_SIZE_OPTIONS}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onLeadClick={handleLeadClick}
      />
    </div>
  );
}
