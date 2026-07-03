import type {
  KbCustomTextItem,
  KbFileItem,
  KbPagination,
  KbQnAItem,
  KbSourceType,
  KbUrlItem,
} from "@/types/kbItems";

export interface KbAttachmentMeta {
  attachment_id?: string;
  agent_id?: string;
  attached_at?: string;
  attached_by_user_id?: string;
  source_type?: KbSourceType;
}

export interface AttachedUrlItem extends KbUrlItem, KbAttachmentMeta {}
export interface AttachedFileItem extends KbFileItem, KbAttachmentMeta {}
export interface AttachedCustomTextItem extends KbCustomTextItem, KbAttachmentMeta {
  content?: string;
}
export interface AttachedQnAItem extends KbQnAItem, KbAttachmentMeta {
  question?: string;
  answer?: string;
}

export interface ListAttachedUrlsResponse extends KbPagination {
  success: boolean;
  message?: string;
  agent_id: string;
  urls: AttachedUrlItem[];
}

export interface ListAttachedFilesResponse extends KbPagination {
  success: boolean;
  message?: string;
  agent_id: string;
  files: AttachedFileItem[];
}

export interface ListAttachedCustomTextsResponse extends KbPagination {
  success: boolean;
  message?: string;
  agent_id: string;
  custom_texts: AttachedCustomTextItem[];
}

export interface ListAttachedQaPairsResponse extends KbPagination {
  success: boolean;
  message?: string;
  agent_id: string;
  qa_pairs: AttachedQnAItem[];
}

export interface KbAttachmentInput {
  kb_id: string;
  source_type: KbSourceType;
}

export interface KbAttachmentRow extends KbAttachmentInput {
  attachment_id?: string;
  agent_id?: string;
  team_id?: string;
  attached_by_user_id?: string;
  attached_at?: string;
  status?: "draft" | "indexing" | "ready" | "failed" | null;
  title?: string | null;
  url?: string | null;
  file_name?: string | null;
  custom_text_alias?: string | null;
  qna_alias?: string | null;
  updated_at?: string | null;
}

export interface NewFileInput {
  kb_id: string;
  file_key: string;
}

export interface AgentKbUpdateFields {
  kb_attachments?: KbAttachmentInput[];
  new_urls?: string[];
  new_files?: NewFileInput[];
  new_custom_texts?: Array<{ custom_text_alias: string; custom_text: string }>;
  new_qa_pairs?: Array<{
    qna_alias: string;
    question: string;
    answer: string;
  }>;
}
