import Cookies from "js-cookie";
import fastApiAxios from "@/utils/fastapi_axios";
import type {
  CreateUrlsResponse,
  GeneratePresignedUrlsResponse,
  KbCustomTextDetail,
  KbPresignedUrlEntry,
  KbQnADetail,
  KbSearchSourceType,
  KbSourceType,
  ListCustomTextsResponse,
  ListFilesResponse,
  ListQnAPairsResponse,
  ListUrlsResponse,
  PresignedUrlFile,
  SearchKbItemsResponse,
} from "@/types/kbItems";

const KB_ITEMS_BASE = "/elysium-agents/elysium-atlas/kb-items/v1";

function getAuthHeaders() {
  const token = Cookies.get("elysium_atlas_session_token");
  return { Authorization: `Bearer ${token}` };
}

export async function listUrls(
  page: number,
  limit: number,
): Promise<ListUrlsResponse> {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/list-urls`,
    { page, limit },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function searchKbItems(
  sourceType: KbSearchSourceType,
  searchQuery: string,
  page: number,
  limit: number,
): Promise<SearchKbItemsResponse> {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/search-items`,
    {
      source_type: sourceType,
      search_query: searchQuery.trim(),
      page,
      limit,
    },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function createUrls(urls: string[]): Promise<CreateUrlsResponse> {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/create-urls`,
    { urls },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function deleteUrl(kbId: string) {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/delete-url`,
    { kb_id: kbId },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function reindexItem(kbId: string, sourceType: KbSourceType) {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/reindex-item`,
    { kb_id: kbId, source_type: sourceType },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function listFiles(
  page: number,
  limit: number,
): Promise<ListFilesResponse> {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/list-files`,
    { page, limit },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function createFile(fileName: string) {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/create-file`,
    { file_name: fileName },
    { headers: getAuthHeaders() },
  );
  return response.data as {
    success: boolean;
    message?: string;
    kb_id: string;
    status: string;
  };
}

export async function generatePresignedUrls(
  kbId: string,
  files: Array<{ file_name: string; filetype: string }>,
): Promise<GeneratePresignedUrlsResponse> {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/generate-presigned-urls`,
    { kb_id: kbId, files },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

/** Normalize kb-items presigned response (flat array + s3_key) for upload. */
export function parseKbPresignedUrls(
  response: GeneratePresignedUrlsResponse,
): PresignedUrlFile[] {
  const raw = response.presigned_urls;
  if (!raw) return [];

  const entries: KbPresignedUrlEntry[] = Array.isArray(raw)
    ? raw
    : (raw.files ?? []).map((file) => ({
        upload_url: file.upload_url,
        s3_key: file.file_key,
        filename: file.file_name,
      }));

  return entries
    .filter((entry) => entry.upload_url && (entry.s3_key || entry.file_key))
    .map((entry) => ({
      file_name: entry.filename ?? entry.file_name ?? "",
      upload_url: entry.upload_url,
      file_key: entry.s3_key ?? entry.file_key ?? "",
    }));
}

export async function finalizeFile(kbId: string, fileKey: string) {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/finalize-file`,
    { kb_id: kbId, file_key: fileKey },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function deleteFile(kbId: string) {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/delete-file`,
    { kb_id: kbId },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function listCustomTexts(
  page: number,
  limit: number,
): Promise<ListCustomTextsResponse> {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/list-custom-texts`,
    { page, limit },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function getCustomText(kbId: string): Promise<{
  success: boolean;
  message?: string;
  custom_text?: KbCustomTextDetail;
}> {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/get-custom-text`,
    { kb_id: kbId },
    { headers: getAuthHeaders() },
  );
  const data = response.data as {
    success: boolean;
    message?: string;
    custom_text?: KbCustomTextDetail;
    item?: KbCustomTextDetail;
  };

  return {
    success: data.success,
    message: data.message,
    custom_text: data.custom_text ?? data.item,
  };
}

export async function createCustomText(
  customTextAlias: string,
  content: string,
) {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/create-custom-text`,
    { custom_text_alias: customTextAlias, content },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function updateCustomText(
  kbId: string,
  customTextAlias: string,
  content: string,
) {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/update-custom-text`,
    { kb_id: kbId, custom_text_alias: customTextAlias, content },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function deleteCustomText(kbId: string) {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/delete-custom-text`,
    { kb_id: kbId },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function listQnAPairs(
  page: number,
  limit: number,
): Promise<ListQnAPairsResponse> {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/list-qa-pairs`,
    { page, limit },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function getQnAPair(kbId: string): Promise<{
  success: boolean;
  message?: string;
  qa_pair?: KbQnADetail;
}> {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/get-qa-pair`,
    { kb_id: kbId },
    { headers: getAuthHeaders() },
  );
  const data = response.data as {
    success: boolean;
    message?: string;
    qa_pair?: KbQnADetail;
    item?: KbQnADetail;
  };

  return {
    success: data.success,
    message: data.message,
    qa_pair: data.qa_pair ?? data.item,
  };
}

export async function createQnAPair(
  qnaAlias: string,
  question: string,
  answer: string,
) {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/create-qa-pair`,
    { qna_alias: qnaAlias, question, answer },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function updateQnAPair(
  kbId: string,
  qnaAlias: string,
  question: string,
  answer: string,
) {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/update-qa-pair`,
    { kb_id: kbId, qna_alias: qnaAlias, question, answer },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function deleteQnAPair(kbId: string) {
  const response = await fastApiAxios.post(
    `${KB_ITEMS_BASE}/delete-qa-pair`,
    { kb_id: kbId },
    { headers: getAuthHeaders() },
  );
  return response.data;
}

export async function pingUrl(url: string) {
  const response = await fastApiAxios.post(
    "/elysium-agents/elysium-atlas/v1/ping-url",
    { url },
  );
  return response.data;
}

export async function extractUrlLinks(source: "url" | "sitemap", link: string) {
  const token = Cookies.get("elysium_atlas_session_token");
  const response = await fastApiAxios.post(
    "/elysium-agents/elysium-atlas/v1/extract-url-links",
    { source, link },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.data;
}
