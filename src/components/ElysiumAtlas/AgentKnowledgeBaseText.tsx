"use client";
import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { useAppSelector } from "@/store";
import {
  setKnowledgeBaseText,
  setTriggerFetchAgentCustomTexts,
} from "@/store/reducers/agentSlice";
import { CustomText } from "@/store/types/AgentBuilderTypes";
import { toast } from "sonner";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";

export default function AgentKnowledgeBaseText() {
  const dispatch = useDispatch();
  const agentID = useSelector((state: RootState) => state.agent.agentID);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggerFetchAgentCustomTexts = useAppSelector(
    (state) => state.agent.triggerFetchAgentCustomTexts,
  );

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const fetchAgentCustomTexts = async (isPolling = false): Promise<boolean> => {
    if (!agentID) return false;

    const token = Cookies.get("elysium_atlas_session_token");

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/get-agent-custom-texts",
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
        const texts = response.data.custom_texts?.data || [];

        // Map texts to CustomText format
        // Note: API response only includes custom_text_alias, not the actual custom_text content
        const mappedTexts: CustomText[] = texts.map((textItem: any) => ({
          custom_text_alias: textItem.custom_text_alias,
          custom_text: "", // API doesn't return the actual text content in this endpoint
          lastUpdated: textItem.updated_at || textItem.created_at || "",
          status: textItem.status ?? "indexed",
        }));

        dispatch(setKnowledgeBaseText(mappedTexts));

        const hasIndexing = mappedTexts.some(
          (t: any) => t.status === "indexing",
        );
        if (!hasIndexing) stopPolling();
        return hasIndexing;
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch agent custom texts";
      if (!isPolling) toast.error(errorMessage);
      stopPolling();
    }
    return false;
  };

  const startPollingIfNeeded = (hasIndexing: boolean) => {
    if (hasIndexing && !pollingRef.current) {
      pollingRef.current = setInterval(() => {
        fetchAgentCustomTexts(true);
      }, 5000);
    }
  };

  useEffect(() => {
    if (!agentID) return;
    fetchAgentCustomTexts().then(startPollingIfNeeded);
    return () => stopPolling();
  }, [agentID]);

  useEffect(() => {
    if (!agentID || triggerFetchAgentCustomTexts === 0) return;
    stopPolling();
    fetchAgentCustomTexts().then(startPollingIfNeeded);
  }, [triggerFetchAgentCustomTexts]);

  // No JSX to render
  return null;
}
