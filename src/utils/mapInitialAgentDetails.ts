import { mapKbAttachmentsToState } from "@/utils/agentKbUtils";
import { normalizeToolCallingConfig } from "@/types/tools";

export function mapInitialAgentDetails(details: any) {
  if (!details) return null;

  const kbState = mapKbAttachmentsToState(details.kb_attachments);

  return {
    agentID: details.agent_id || details.agentID || "",
    agentName: details.agent_name,
    baseURL: details.base_url,
    agent_status: details.agent_status,
    agent_current_task: details.agent_current_task,
    progress: details.progress,
    systemPrompt: details.system_prompt,
    temperature: details.temperature,
    welcomeMessage: details.welcome_message,
    llmModel: details.llm_model,
    retrievalStrategy: details.retrieval_strategy || "simple",
    toolIds: Array.isArray(details.tool_ids) ? details.tool_ids : [],
    toolCallingConfig: normalizeToolCallingConfig(details.tool_calling_config),
    knowledgeBaseLinks: kbState.knowledgeBaseLinks,
    knowledgeBaseFiles: kbState.knowledgeBaseFiles,
    knowledgeBaseText: kbState.knowledgeBaseText,
    knowledgeBaseQnA: kbState.knowledgeBaseQnA,
    agent_icon: details.agent_icon ?? null,
    primary_color: details.primary_color || "#fff",
    secondary_color: details.secondary_color || "#fff",
    text_color: details.text_color || "#111",
  };
}
