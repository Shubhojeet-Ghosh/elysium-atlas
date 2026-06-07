export interface EmailKnowledgeItem {
  knowledge_id: string;
  team_id: string;
  title: string;
  status?: string;
  chunk_count?: number;
  char_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EmailKnowledgeState {
  teamID: string;
  knowledgeItems: EmailKnowledgeItem[];
  isLoaded: boolean;
}

export interface ListTeamKnowledgeResponse {
  success: boolean;
  message?: string;
  team_id?: string;
  count?: number;
  knowledge_items?: EmailKnowledgeItem[];
}
