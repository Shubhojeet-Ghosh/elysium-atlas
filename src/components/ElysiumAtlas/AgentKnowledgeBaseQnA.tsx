"use client";
import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { setKnowledgeBaseQnA } from "@/store/reducers/agentSlice";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { toast } from "sonner";

export default function AgentKnowledgeBaseQnA() {
  const dispatch = useAppDispatch();
  const agentID = useAppSelector((state) => state.agent.agentID);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchQAPairs = async () => {
      if (!agentID) return;

      setIsLoading(true);
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
          }
        );

        if (response.data.success === true) {
          const qaPairs = response.data.qa_pairs?.data || [];

          // Map QA pairs to QnA format
          const mappedQnA = qaPairs.map((item: any) => ({
            qna_alias: item.qna_alias,
            question: "", // Will be fetched on demand when user clicks
            answer: "", // Will be fetched on demand when user clicks
            lastUpdated: item.updated_at || item.created_at,
            status: "existing",
          }));

          dispatch(setKnowledgeBaseQnA(mappedQnA));
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch QA pairs";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQAPairs();
  }, [agentID, dispatch]);

  return null; // This component doesn't render anything
}
