"use client";
import { useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  setKnowledgeBaseQnA,
  setTriggerFetchAgentQnA,
} from "@/store/reducers/agentSlice";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { toast } from "sonner";

export default function AgentKnowledgeBaseQnA() {
  const dispatch = useAppDispatch();
  const agentID = useAppSelector((state) => state.agent.agentID);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggerFetchAgentQnA = useAppSelector(
    (state) => state.agent.triggerFetchAgentQnA,
  );

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const fetchQAPairs = async (isPolling = false): Promise<boolean> => {
    if (!agentID) return false;

    const token = Cookies.get("elysium_atlas_session_token");

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/get-agent-qa-pairs",
        {
          agent_id: agentID,
          limit: 1000,
          cursor: null,
          include_count: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success === true) {
        const qaPairs = response.data.qa_pairs?.data || [];

        const mappedQnA = qaPairs.map((item: any) => ({
          qna_alias: item.qna_alias,
          question: "", // Fetched on demand when user clicks
          answer: "", // Fetched on demand when user clicks
          lastUpdated: item.updated_at || item.created_at,
          status: item.status ?? "indexed",
        }));

        dispatch(setKnowledgeBaseQnA(mappedQnA));

        const hasIndexing = mappedQnA.some((q: any) => q.status !== "active");
        if (!hasIndexing) stopPolling();
        return hasIndexing;
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch QA pairs";
      if (!isPolling) toast.error(errorMessage);
      stopPolling();
    }
    return false;
  };

  const startPollingIfNeeded = (hasIndexing: boolean) => {
    if (hasIndexing && !pollingRef.current) {
      pollingRef.current = setInterval(() => {
        fetchQAPairs(true);
      }, 5000);
    }
  };

  useEffect(() => {
    if (!agentID) return;
    fetchQAPairs().then(startPollingIfNeeded);
    return () => stopPolling();
  }, [agentID]);

  useEffect(() => {
    if (!agentID || triggerFetchAgentQnA === 0) return;
    stopPolling();
    fetchQAPairs().then(startPollingIfNeeded);
  }, [triggerFetchAgentQnA]);

  return null;
}
