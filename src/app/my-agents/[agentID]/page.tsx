"use client";

import LeftNav from "@/components/ElysiumAtlas/LeftNav";
import TopNav from "@/components/ElysiumAtlas/TopNav";
import AiSocketListener from "@/components/AiSocketListener";
import PageContent from "@/components/ElysiumAtlas/PageContent";
import BuildNewAgent from "@/components/ElysiumAtlas/BuildNewAgent";
import MyAgent from "@/components/ElysiumAtlas/MyAgent";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { useAppDispatch } from "@/store";
import {
  setAgentName,
  setAgentID,
  setBaseURL,
  setAgentStatus,
  setAgentCurrentTask,
  setProgress,
  setKnowledgeBaseLinks,
  setKnowledgeBaseFiles,
  setKnowledgeBaseText,
  setKnowledgeBaseQnA,
} from "@/store/reducers/agentSlice";

export default function AgentPage() {
  const params = useParams();
  const agentID = params.agentID as string;
  const dispatch = useAppDispatch();
  const [initialAgentDetails, setInitialAgentDetails] = useState<any>(null);

  useEffect(() => {
    const allowedStatuses = ["active", "failed", "inactive"];

    const fetchAgentDetails = async () => {
      const token = Cookies.get("elysium_atlas_session_token");
      try {
        const response = await fastApiAxios.post(
          "/elysium-agents/elysium-atlas/agent/v1/get-agent-details",
          {
            agent_id: agentID,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data.success === true) {
          const agentDetails = response.data.agent_details;
          if (initialAgentDetails === null) {
            setInitialAgentDetails(agentDetails);
          }
          dispatch(setAgentName(agentDetails.agent_name));
          dispatch(setAgentID(agentDetails.agent_id));
          dispatch(setBaseURL(agentDetails.base_url || ""));
          dispatch(setAgentStatus(agentDetails.agent_status));
          dispatch(setAgentCurrentTask(agentDetails.agent_current_task));
          dispatch(setProgress(agentDetails.progress || 0));
          dispatch(
            setKnowledgeBaseLinks(
              agentDetails.links.map((link: any) => ({
                link: link.url,
                checked: true,
                status: "uploaded",
              }))
            )
          );
          dispatch(
            setKnowledgeBaseFiles(
              agentDetails.files.map((file: any) => ({
                name: file.file_name,
                size: 0,
                type: "",
                checked: true,
                s3_key: file.file_key,
                cdn_url: null,
                status: "uploaded",
              }))
            )
          );
          dispatch(
            setKnowledgeBaseText(
              agentDetails.custom_texts.map((text: any) => ({
                custom_text_alias: text.custom_text_alias,
                custom_text: "",
                lastUpdated: text.created_at,
                status: "uploaded",
              }))
            )
          );
          dispatch(
            setKnowledgeBaseQnA(
              agentDetails.qa_pairs.map((qna: any) => ({
                qna_alias: qna.qna_alias,
                question: "",
                answer: "",
                lastUpdated: qna.created_at,
                status: "uploaded",
              }))
            )
          );

          // If status is not in allowedStatuses, poll again after 5 seconds
          if (!allowedStatuses.includes(agentDetails.agent_status)) {
            setTimeout(fetchAgentDetails, 5000);
          }
        }
      } catch (error) {
        console.error("Error fetching agent details:", error);
      }
    };

    if (agentID) {
      fetchAgentDetails();
    }
  }, [agentID, dispatch]);

  return (
    <>
      <AiSocketListener />
      <TopNav />

      <LeftNav />

      <PageContent>
        <div className="lg:px-[50px] px-4 mt-[40px]">
          <MyAgent />
        </div>
      </PageContent>
    </>
  );
}
