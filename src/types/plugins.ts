export interface PluginParametersSchema {
  type: "object";
  properties: Record<string, Record<string, unknown>>;
  required?: string[];
}

export interface Plugin {
  plugin_id: string;
  team_id: string;
  created_by_user_id: string;
  name: string;
  display_name: string;
  description: string;
  parameters: PluginParametersSchema;
  python_code: string;
  secret_names: string[];
  secrets_configured: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePluginRequest {
  python_code: string;
}

export interface UpdatePluginRequest {
  plugin_id: string;
  python_code?: string;
  is_active?: boolean;
}

export interface SetPluginSecretsRequest {
  plugin_id: string;
  secrets: Record<string, string | null>;
}

export interface ListPluginsResponse {
  success: boolean;
  plugins?: Plugin[];
  total?: number;
  page?: number;
  limit?: number;
  total_pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
  message?: string;
}

export interface PluginResponse {
  success: boolean;
  plugin?: Plugin;
  message?: string;
}

export interface DeletePluginResponse {
  success: boolean;
  message?: string;
}

export interface PluginParameterChip {
  name: string;
  type: string;
  required: boolean;
}
