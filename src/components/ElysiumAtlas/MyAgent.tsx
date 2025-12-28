import { useState, useEffect, useMemo } from "react";
import Cookies from "js-cookie";
import { CustomTabs } from "@/components/ui/CustomTabs";
import AgentBuilderTabs from "./AgentBuilderTabs";
import AgentMainContent from "./AgentMainContent";
import UnsavedChangesBar from "./UnsavedChangesBar";
import { useCurrentAgentDetails } from "./useAgentDetailsCompare";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setAgentName,
  setBaseURL,
  setAgentStatus,
  setAgentCurrentTask,
  setProgress,
  setSystemPrompt,
  setTemperature,
  setWelcomeMessage,
  setLlmModel,
  setKnowledgeBaseLinks,
  setKnowledgeBaseFiles,
  setKnowledgeBaseText,
  setKnowledgeBaseQnA,
  setTriggerGetAgentDetails,
} from "@/store/reducers/agentSlice";
import { mapInitialAgentDetails } from "@/utils/mapInitialAgentDetails";
import fastApiAxios from "@/utils/fastapi_axios";
import { toast } from "sonner";

export default function MyAgent({
  initialAgentDetails,
}: {
  initialAgentDetails: any;
}) {
  const [activeTab, setActiveTab] = useState("agent");

  const mappedInitial = useMemo(
    () =>
      initialAgentDetails ? mapInitialAgentDetails(initialAgentDetails) : null,
    [initialAgentDetails]
  );

  const dispatch = useAppDispatch();
  const triggerGetAgentDetails = useAppSelector(
    (state) => state.agent.triggerGetAgentDetails
  );
  const currentAgentDetails = useCurrentAgentDetails();

  const buildUpdatePayload = (
    mappedInitial: any,
    current: any,
    initialAgentDetails: any
  ) => {
    const payload: any = {
      agent_id:
        current?.agentID ||
        mappedInitial?.agentID ||
        initialAgentDetails?.agent_id ||
        initialAgentDetails?.agentID,
    };

    // Check each field for changes and add to payload if different
    if (mappedInitial.agentName !== current.agentName) {
      payload.agent_name = current.agentName;
    }

    if (mappedInitial.baseURL !== current.baseURL) {
      payload.base_url = current.baseURL;
    }

    if (mappedInitial.systemPrompt !== current.systemPrompt) {
      payload.system_prompt = current.systemPrompt;
    }

    if (mappedInitial.welcomeMessage !== current.welcomeMessage) {
      payload.welcome_message = current.welcomeMessage;
    }

    if (mappedInitial.llmModel !== current.llmModel) {
      payload.llm_model = current.llmModel;
    }

    if (mappedInitial.temperature !== current.temperature) {
      payload.temperature = current.temperature;
    }

    // Compare arrays for links
    if (
      JSON.stringify(mappedInitial.knowledgeBaseLinks) !==
      JSON.stringify(current.knowledgeBaseLinks)
    ) {
      payload.links =
        current.knowledgeBaseLinks
          ?.filter((link: any) => link.checked)
          ?.map((link: any) => link.link) || [];
    }

    // Compare arrays for files
    if (
      JSON.stringify(mappedInitial.knowledgeBaseFiles) !==
      JSON.stringify(current.knowledgeBaseFiles)
    ) {
      payload.files =
        current.knowledgeBaseFiles
          ?.filter((file: any) => file.checked)
          ?.map((file: any) => ({
            file_name: file.name,
            file_key: file.s3_key,
            cdn_url: file.cdn_url,
            file_source: "local",
          })) || [];
    }

    // Compare arrays for custom texts
    if (
      JSON.stringify(mappedInitial.knowledgeBaseText) !==
      JSON.stringify(current.knowledgeBaseText)
    ) {
      payload.custom_texts =
        current.knowledgeBaseText?.map((text: any) => ({
          custom_text_alias: text.custom_text_alias,
          custom_text: text.custom_text,
        })) || [];
    }

    // Compare arrays for QnA pairs
    if (
      JSON.stringify(mappedInitial.knowledgeBaseQnA) !==
      JSON.stringify(current.knowledgeBaseQnA)
    ) {
      payload.qa_pairs =
        current.knowledgeBaseQnA?.map((qna: any) => ({
          qna_alias: qna.qna_alias,
          question: qna.question,
          answer: qna.answer,
        })) || [];
    }

    return payload;
  };

  const handleUpdate = async () => {
    try {
      const current = currentAgentDetails;

      if (!mappedInitial || !current) {
        toast.error("Unable to save: Missing agent details");
        return;
      }

      let payload = buildUpdatePayload(
        mappedInitial,
        current,
        initialAgentDetails
      );

      console.log("Update payload:", payload);

      const token = Cookies.get("elysium_atlas_session_token");
      // Make API call
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/update-agent",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Agent updated successfully");
        dispatch(setTriggerGetAgentDetails(triggerGetAgentDetails + 1));
      } else {
        toast.error(
          "Failed to update agent: " +
            (response.data.message || "Unknown error")
        );
      }
    } catch (error: any) {
      console.error("Update error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update agent";
      toast.error(errorMessage);
    }
  };

  const handleClear = () => {
    console.log("[handleClear] initialAgentDetails:", initialAgentDetails);
    if (!initialAgentDetails) {
      console.warn("[handleClear] No initial agent details to clear to");
      return;
    }

    // Check if initialAgentDetails is already mapped (has camelCase properties)
    // or if it needs mapping (has snake_case properties)
    const isAlreadyMapped =
      "agentName" in initialAgentDetails || "baseURL" in initialAgentDetails;
    const dataToUse = isAlreadyMapped ? initialAgentDetails : mappedInitial;

    console.log("[handleClear] isAlreadyMapped:", isAlreadyMapped);
    console.log("[handleClear] dataToUse:", dataToUse);

    if (!dataToUse) {
      console.warn("[handleClear] No data to clear to");
      return;
    }

    // Reset all fields to initial values
    if (dataToUse.agentName !== undefined)
      dispatch(setAgentName(dataToUse.agentName || ""));
    if (dataToUse.baseURL !== undefined)
      dispatch(setBaseURL(dataToUse.baseURL || ""));
    if (dataToUse.agent_status !== undefined)
      dispatch(setAgentStatus(dataToUse.agent_status || ""));
    if (dataToUse.agent_current_task !== undefined)
      dispatch(setAgentCurrentTask(dataToUse.agent_current_task || ""));
    if (dataToUse.progress !== undefined)
      dispatch(setProgress(dataToUse.progress || 0));
    if (dataToUse.systemPrompt !== undefined)
      dispatch(setSystemPrompt(dataToUse.systemPrompt || ""));
    if (dataToUse.temperature !== undefined)
      dispatch(setTemperature(dataToUse.temperature || 0));
    if (dataToUse.welcomeMessage !== undefined)
      dispatch(setWelcomeMessage(dataToUse.welcomeMessage || ""));
    if (dataToUse.llmModel !== undefined)
      dispatch(setLlmModel(dataToUse.llmModel || ""));
    if (dataToUse.knowledgeBaseLinks !== undefined)
      dispatch(setKnowledgeBaseLinks(dataToUse.knowledgeBaseLinks || []));
    if (dataToUse.knowledgeBaseFiles !== undefined)
      dispatch(setKnowledgeBaseFiles(dataToUse.knowledgeBaseFiles || []));
    if (dataToUse.knowledgeBaseText !== undefined)
      dispatch(setKnowledgeBaseText(dataToUse.knowledgeBaseText || []));
    if (dataToUse.knowledgeBaseQnA !== undefined)
      dispatch(setKnowledgeBaseQnA(dataToUse.knowledgeBaseQnA || []));
  };

  useEffect(() => {
    console.log("[MyAgent] initialAgentDetails:", initialAgentDetails);
    console.log("[MyAgent] currentAgentDetails:", currentAgentDetails);
  }, [initialAgentDetails, currentAgentDetails]);

  return (
    <>
      <div className="sticky top-[65px] z-50 border-b border-gray-200 dark:border-gray-700">
        <CustomTabs value={activeTab} onValueChange={setActiveTab}>
          <AgentBuilderTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </CustomTabs>
      </div>
      {activeTab === "agent" && (
        <AgentMainContent
          initialAgentDetails={mappedInitial}
          onSave={handleUpdate}
        />
      )}
      {mappedInitial && (
        <UnsavedChangesBar
          initial={mappedInitial}
          current={currentAgentDetails}
          onSave={handleUpdate}
          onClear={handleClear}
        />
      )}
    </>
  );
}
