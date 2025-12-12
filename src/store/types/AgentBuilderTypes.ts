export interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

export interface KnowledgeBaseLink {
  link: string;
  checked: boolean;
}

export interface AgentBuilderState {
  currentStep: number;
  agentName: string;
  knowledgeBase: string;
  knowledgeBaseSitemap: string;
  knowledgeBaseLinks: KnowledgeBaseLink[];
  knowledgeBaseFiles: FileMetadata[];
  knowledgeBaseText: string;
  baseURL: string;
}

