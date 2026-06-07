export interface EmailToolDefinition {
  tool_id: string;
  team_id?: string;
  name: string;
  display_name: string;
  description?: string;
  endpoint_url?: string;
  http_method?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmailToolsState {
  teamID: string;
  tools: EmailToolDefinition[];
  isLoaded: boolean;
}

export interface ListTeamToolsResponse {
  success: boolean;
  message?: string;
  team_id?: string;
  count?: number;
  tools?: EmailToolDefinition[];
}
