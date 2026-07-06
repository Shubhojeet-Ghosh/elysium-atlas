export type LeadFieldKey = "email" | "name" | "phone" | "company" | "interest";

export interface LeadCollectionFieldConfig {
  key: LeadFieldKey;
  required: boolean;
  order: number;
}

export interface LeadCollectionConfig {
  enable_lead_capturing: boolean;
  collection_trigger_prompt: string;
  min_messages_before_ask: number;
  fields: LeadCollectionFieldConfig[];
}

export interface LeadFieldCatalogItem {
  key: LeadFieldKey;
  label: string;
  description: string;
}

export interface GetLeadCollectionConfigRequest {
  agent_id: string;
}

export interface UpdateLeadCollectionConfigRequest {
  agent_id: string;
  enable_lead_capturing?: boolean;
  collection_trigger_prompt?: string;
  min_messages_before_ask?: number;
  fields?: LeadCollectionFieldConfig[];
}

export interface ResetLeadCollectionConfigRequest {
  agent_id: string;
}

export interface GetLeadCollectionConfigResponse {
  success: boolean;
  agent_id: string;
  lead_collection_config: LeadCollectionConfig;
  field_catalog: LeadFieldCatalogItem[];
  message?: string;
}

export interface UpdateLeadCollectionConfigResponse {
  success: boolean;
  message?: string;
  agent_id: string;
  lead_collection_config: LeadCollectionConfig;
}

export interface ResetLeadCollectionConfigResponse {
  success: boolean;
  message?: string;
  agent_id: string;
  lead_collection_config: LeadCollectionConfig;
}

export interface GetFieldCatalogResponse {
  success: boolean;
  field_catalog: LeadFieldCatalogItem[];
  message?: string;
}

export interface LeadCollectionFieldRow extends LeadCollectionFieldConfig {
  id: string;
  /** Client-only display label for fields added via the custom field dialog. */
  customLabel?: string;
}

export type SessionLeadListStatus = "partial" | "complete" | null;

export type SessionLeadPipelineStatus =
  | "not_started"
  | "collecting"
  | "partial"
  | "complete";

export interface SessionLeadCollectionField {
  key: LeadFieldKey | string;
  label: string;
  required: boolean;
  order: number;
  value: string | null;
  captured: boolean;
}

export interface SessionLeadCollection {
  enabled: boolean;
  list_status: SessionLeadListStatus;
  status: SessionLeadPipelineStatus;
  trigger_reason?: string | null;
  triggered_at_message?: number | null;
  completed_at?: string | null;
  next_field?: string | null;
  declined_fields?: string[];
  skipped_fields?: string[];
  fields: SessionLeadCollectionField[];
}

export interface UpdateSessionLeadRequest {
  agent_id: string;
  chat_session_id: string;
  fields: Record<string, string | null>;
}

export interface UpdateSessionLeadResponse {
  success: boolean;
  message?: string;
  agent_id: string;
  chat_session_id: string;
  lead_status?: SessionLeadListStatus;
  lead_email?: string | null;
  lead_name?: string | null;
  lead_collection: SessionLeadCollection;
}
