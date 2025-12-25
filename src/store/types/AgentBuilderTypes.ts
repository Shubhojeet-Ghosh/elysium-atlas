export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  checked?: boolean;
}

export interface KnowledgeBaseLink {
  link: string;
  checked: boolean;
}

export interface CustomText {
  custom_text_alias: string;
  custom_text: string;
  lastUpdated: string;
}

export interface QnA {
  qna_alias: string;
  question: string;
  answer: string;
  lastUpdated: string;
}

export interface AgentBuilderState {
  currentStep: number;
  agentName: string;
  agentID: string;
  knowledgeBase: string;
  knowledgeBaseSitemap: string;
  knowledgeBaseLinks: KnowledgeBaseLink[];
  knowledgeBaseFiles: FileMetadata[];
  knowledgeBaseText: CustomText[];
  knowledgeBaseQnA: QnA[];
  baseURL: string;
}
