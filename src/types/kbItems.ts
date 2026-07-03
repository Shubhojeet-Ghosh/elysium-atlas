export type KbItemStatus = "draft" | "indexing" | "ready" | "failed";
export type KbSourceType = "url" | "file" | "custom_text" | "qa_pair";

export interface KbPagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface KbUrlItem {
  kb_id: string;
  url: string;
  status: KbItemStatus;
  page_type?: string;
  summary?: string;
  updated_at?: string | null;
}

export interface KbPendingUrl {
  url: string;
  checked: boolean;
}

export interface KbFileItem {
  kb_id: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  file_key?: string;
  status: KbItemStatus;
  updated_at?: string | null;
}

export interface KbCustomTextItem {
  kb_id: string;
  custom_text_alias: string;
  status: KbItemStatus;
  summary?: string;
  updated_at?: string | null;
}

export interface KbCustomTextDetail extends KbCustomTextItem {
  content: string;
}

export interface KbQnAItem {
  kb_id: string;
  qna_alias: string;
  status: KbItemStatus;
  summary?: string;
  updated_at?: string | null;
}

export interface KbQnADetail extends KbQnAItem {
  question: string;
  answer: string;
}

export interface ListUrlsResponse extends KbPagination {
  success: boolean;
  message?: string;
  urls: KbUrlItem[];
}

export interface ListFilesResponse extends KbPagination {
  success: boolean;
  message?: string;
  files: KbFileItem[];
}

export interface ListCustomTextsResponse extends KbPagination {
  success: boolean;
  message?: string;
  custom_texts: KbCustomTextItem[];
}

export interface ListQnAPairsResponse extends KbPagination {
  success: boolean;
  message?: string;
  qa_pairs: KbQnAItem[];
}

export interface CreateUrlsResponse {
  success: boolean;
  message?: string;
  items: Array<{ kb_id: string; url: string; status: KbItemStatus }>;
}

export type KbSearchSourceType = "url" | "file" | "custom_text" | "qa_pair";

export interface SearchKbItemsResponse extends KbPagination {
  success: boolean;
  message?: string;
  source_type: KbSearchSourceType;
  search_query: string;
  urls?: KbUrlItem[];
  files?: KbFileItem[];
  custom_texts?: KbCustomTextItem[];
  qa_pairs?: KbQnAItem[];
}

export interface PresignedUrlFile {
  file_name: string;
  upload_url: string;
  file_key: string;
}

/** Raw presigned entry from kb-items API */
export interface KbPresignedUrlEntry {
  status?: boolean;
  upload_url: string;
  s3_key: string;
  filename: string;
  visibility?: string;
  file_key?: string;
  file_name?: string;
}

export interface GeneratePresignedUrlsResponse {
  success: boolean;
  message?: string;
  /** kb-items API returns a flat array */
  presigned_urls?: KbPresignedUrlEntry[] | { files: PresignedUrlFile[] };
}
