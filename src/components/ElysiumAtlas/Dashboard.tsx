"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import AutoComplete from "@/components/ui/AutoComplete";
import ChatSessionCountsChart from "@/components/ElysiumAtlas/ChatSessionCountsChart";
import fastApiAxios from "@/utils/fastapi_axios";

const ALL_AGENTS_VALUE = "__all__";

type AgentOption = {
  agent_id: string;
  agent_name: string;
};

export default function Dashboard() {
  const [selectedAgentId, setSelectedAgentId] = useState(ALL_AGENTS_VALUE);
  const [agentOptions, setAgentOptions] = useState<AgentOption[]>([]);

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
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/list-agents",
        { page: 1, limit: 100 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data?.success && Array.isArray(response.data.agents)) {
        setAgentOptions(
          response.data.agents.map((agent: AgentOption) => ({
            agent_id: agent.agent_id,
            agent_name: agent.agent_name,
          })),
        );
      }
    } catch {
      setAgentOptions([]);
    }
  }, []);

  useEffect(() => {
    loadAgentOptions();
  }, [loadAgentOptions]);

  const agentId =
    selectedAgentId === ALL_AGENTS_VALUE ? undefined : selectedAgentId;

  return (
    <div className="w-full h-full">
      <div className="lg:text-[22px] text-[18px] font-bold text-deep-onyx dark:text-pure-mist">
        Dashboard
      </div>

      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-[220px]">
          <AutoComplete
            items={agentFilterItems}
            value={selectedAgentId}
            placeholder="All agents"
            searchPlaceholder="Search agent..."
            emptyMessage="No agent found."
            onChange={setSelectedAgentId}
            className="text-xs font-medium"
          />
        </div>
      </div>

      <div className="mt-3 w-full lg:w-1/2">
        <ChatSessionCountsChart agentId={agentId} />
      </div>
    </div>
  );
}
