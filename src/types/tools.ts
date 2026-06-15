export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ToolScalarType = "string" | "number" | "integer" | "boolean";
export type ToolArrayItemType = "string" | "number" | "integer" | "boolean";
export type ToolLeafParameterType = ToolScalarType | "enum" | "array";
export type ToolParameterType = ToolLeafParameterType | "object";
export type AuthType = "none" | "api_key";
export type AuthLocation = "header" | "query";
export type TokenPrefix = "Bearer" | "none";

/** @deprecated Use ToolParameterType */
export type ParamType = ToolScalarType;

export interface ToolNestedParameterInput {
  name: string;
  type: ToolLeafParameterType;
  description: string;
  required?: boolean;
  enum_values?: string[];
  items_type?: ToolArrayItemType;
}

export interface ToolParameterInput {
  name: string;
  type: ToolParameterType;
  description: string;
  required?: boolean;
  enum_values?: string[];
  items_type?: ToolArrayItemType;
  properties?: ToolNestedParameterInput[];
}

export interface ToolAuthInput {
  type: AuthType;
  location?: AuthLocation;
  param_name?: string;
  token?: string;
  token_prefix?: TokenPrefix;
}

export interface CreateToolRequest {
  name: string;
  display_name: string;
  description: string;
  api_url: string;
  http_method: HttpMethod;
  auth?: ToolAuthInput;
  parameters?: ToolParameterInput[];
}

export interface ToolAuthResponse {
  type: AuthType;
  location?: AuthLocation;
  param_name?: string;
  token_prefix?: TokenPrefix;
  token_configured?: boolean;
}

export interface ToolParametersSchema {
  type: "object";
  properties: Record<string, Record<string, unknown>>;
  required?: string[];
}

export interface Tool {
  tool_id: string;
  team_id: string;
  created_by_user_id: string;
  name: string;
  display_name: string;
  description: string;
  api_url: string;
  http_method: HttpMethod;
  auth: ToolAuthResponse;
  parameters: ToolParametersSchema;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateToolRequest {
  tool_id: string;
  name?: string;
  display_name?: string;
  description?: string;
  api_url?: string;
  http_method?: HttpMethod;
  auth?: Partial<ToolAuthInput>;
  parameters?: ToolParameterInput[];
  is_active?: boolean;
}

export interface ListToolsResponse {
  success: boolean;
  tools?: Tool[];
  total?: number;
  page?: number;
  limit?: number;
  total_pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
  message?: string;
}

export interface ToolResponse {
  success: boolean;
  tool?: Tool;
  message?: string;
}

export interface DeleteToolResponse {
  success: boolean;
  message?: string;
}

export interface ToolNestedParameterRow {
  id: string;
  name: string;
  type: ToolLeafParameterType;
  description: string;
  required: boolean;
  enum_values?: string[];
  items_type?: ToolArrayItemType;
}

export interface ToolParameterRow {
  id: string;
  name: string;
  type: ToolParameterType;
  description: string;
  required: boolean;
  enum_values?: string[];
  items_type?: ToolArrayItemType;
  properties?: ToolNestedParameterRow[];
}
