import { useAppSelector } from "@/store";
import { useMemo } from "react";

// Returns a minimal object with only the fields that are editable and relevant for comparison
export function useCurrentAgentDetails() {
  const agentName = useAppSelector((state) => state.agent.agentName);
  const agentID = useAppSelector((state) => state.agent.agentID);
  const baseURL = useAppSelector((state) => state.agent.baseURL);
  const agent_status = useAppSelector((state) => state.agent.agent_status);
  const agent_current_task = useAppSelector(
    (state) => state.agent.agent_current_task,
  );
  const progress = useAppSelector((state) => state.agent.progress);
  const systemPrompt = useAppSelector((state) => state.agent.systemPrompt);
  const temperature = useAppSelector((state) => state.agent.temperature);
  const welcomeMessage = useAppSelector((state) => state.agent.welcomeMessage);
  const llmModel = useAppSelector((state) => state.agent.llmModel);
  const knowledgeBaseLinks = useAppSelector(
    (state) => state.agent.knowledgeBaseLinks,
  );
  const knowledgeBaseFiles = useAppSelector(
    (state) => state.agent.knowledgeBaseFiles,
  );
  const knowledgeBaseText = useAppSelector(
    (state) => state.agent.knowledgeBaseText,
  );
  const knowledgeBaseQnA = useAppSelector(
    (state) => state.agent.knowledgeBaseQnA,
  );
  const agent_icon = useAppSelector((state) => state.agent.agent_icon);
  const primary_color = useAppSelector((state) => state.agent.primary_color);
  const secondary_color = useAppSelector(
    (state) => state.agent.secondary_color,
  );
  const text_color = useAppSelector((state) => state.agent.text_color);

  return useMemo(
    () => ({
      agentName,
      agentID,
      baseURL,
      agent_status,
      agent_current_task,
      progress,
      systemPrompt,
      temperature,
      welcomeMessage,
      llmModel,
      knowledgeBaseLinks,
      knowledgeBaseFiles,
      knowledgeBaseText,
      knowledgeBaseQnA,
      agent_icon,
      primary_color,
      secondary_color,
      text_color,
    }),
    [
      agentName,
      agentID,
      baseURL,
      agent_status,
      agent_current_task,
      progress,
      systemPrompt,
      temperature,
      welcomeMessage,
      llmModel,
      knowledgeBaseLinks,
      knowledgeBaseFiles,
      knowledgeBaseText,
      knowledgeBaseQnA,
      agent_icon,
      primary_color,
      secondary_color,
      text_color,
    ],
  );
}
