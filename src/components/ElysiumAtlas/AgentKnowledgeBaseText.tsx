"use client";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setKnowledgeBaseText } from "@/store/reducers/agentSlice";
import { CustomText } from "@/store/types/AgentBuilderTypes";
import { toast } from "sonner";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";

export default function AgentKnowledgeBaseText() {
  const dispatch = useDispatch();
  const agentID = useSelector((state: RootState) => state.agent.agentID);
  const [isLoadingTexts, setIsLoadingTexts] = useState(false);

  const fetchAgentCustomTexts = async () => {
    if (!agentID) return;

    setIsLoadingTexts(true);
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
        }
      );

      if (response.data.success === true) {
        const texts = response.data.custom_texts?.data || [];

        // Map texts to CustomText format with status "existing"
        // Note: API response only includes custom_text_alias, not the actual custom_text content
        const mappedTexts: CustomText[] = texts.map((textItem: any) => ({
          custom_text_alias: textItem.custom_text_alias,
          custom_text: "", // API doesn't return the actual text content in this endpoint
          lastUpdated: textItem.updated_at || textItem.created_at || "",
          status: "existing",
        }));

        dispatch(setKnowledgeBaseText(mappedTexts));
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch agent custom texts";
      toast.error(errorMessage);
    } finally {
      setIsLoadingTexts(false);
    }
  };

  useEffect(() => {
    if (agentID) {
      fetchAgentCustomTexts();
    }
  }, [agentID]);

  // No JSX to render
  return null;
}
