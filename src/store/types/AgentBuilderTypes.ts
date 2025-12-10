export interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

export interface AgentBuilderState {
  currentStep: number;
  agentName: string;
  knowledgeBase: string;
  knowledgeBaseSitemap: string;
  knowledgeBaseLinks: string;
  knowledgeBaseFiles: FileMetadata[];
  knowledgeBaseText: string;
}

