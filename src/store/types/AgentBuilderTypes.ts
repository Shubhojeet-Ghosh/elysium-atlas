export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  checked?: boolean;
  s3_key?: string | null;
  cdn_url?: string | null;
  status: string;
}

export interface KnowledgeBaseLink {
  link: string;
  checked: boolean;
  status: string;
  updated_at: string | null;
  api_status?: string;
}

export interface CustomText {
  custom_text_alias: string;
  custom_text: string;
  lastUpdated: string;
  status: string;
}

export interface QnA {
  qna_alias: string;
  question: string;
  answer: string;
  lastUpdated: string;
  status: string;
}

export interface AgentBuilderState {
  currentStep: number;
  agentName: string;
  agentID: string;
  knowledgeBaseSitemap: string;
  knowledgeBaseLinks: KnowledgeBaseLink[];
  knowledgeBaseFiles: FileMetadata[];
  knowledgeBaseText: CustomText[];
  knowledgeBaseQnA: QnA[];
  baseURL: string;
}
