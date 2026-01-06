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
    knowledgeBaseLinks:
      details.links?.data?.map((link: any) => ({
        link: link.url,
        checked: true,
        status: "uploaded",
      })) || [],
    knowledgeBaseFiles:
      details.files?.data?.map((file: any) => ({
        name: file.file_name,
        size: 0,
        type: "",
        checked: true,
        s3_key: file.file_key,
        cdn_url: null,
        status: "uploaded",
      })) || [],
    knowledgeBaseText:
      details.custom_texts?.data?.map((text: any) => ({
        custom_text_alias: text.custom_text_alias,
        custom_text: "",
        lastUpdated: text.created_at,
        status: "uploaded",
      })) || [],
    knowledgeBaseQnA:
      details.qa_pairs?.data?.map((qna: any) => ({
        qna_alias: qna.qna_alias,
        question: "",
        answer: "",
        lastUpdated: qna.created_at,
        status: "uploaded",
      })) || [],
  };
}
