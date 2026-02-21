export function mapInitialAgentDetails(details: any) {
  if (!details) return null;
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
    knowledgeBaseLinks: [],
    knowledgeBaseFiles: [],
    knowledgeBaseText: [],
    knowledgeBaseQnA: [],
    agent_icon: details.agent_icon ?? null,
  };
}
