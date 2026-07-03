import type {
  CustomText,
  FileMetadata,
  KnowledgeBaseLink,
  QnA,
} from "@/store/types/AgentBuilderTypes";
import type {
  AttachedCustomTextItem,
  AttachedFileItem,
  AttachedQnAItem,
  AttachedUrlItem,
  KbAttachmentInput,
  KbAttachmentRow,
} from "@/types/agentKb";
import type { KbItemStatus } from "@/types/kbItems";

export type AgentKbRowStatus = "new" | "existing" | "pending_attach";

export type AgentKbDisplayStatus =
  | "new"
  | "from_library"
  | "indexing"
  | "draft"
  | "ready"
  | "failed";

export function getLinkAgentKbDisplayStatus(
  link: KnowledgeBaseLink,
): AgentKbDisplayStatus {
  if (link.status === "new") return "new";
  if (link.status === "pending_attach") return "from_library";
  if (link.status === "existing") {
    const api = normalizeApiStatus(link.api_status);
    if (api === "indexing" || api === "draft" || api === "failed") return api;
    return "ready";
  }
  return "ready";
}

export function getFileAgentKbDisplayStatus(
  file: FileMetadata,
): AgentKbDisplayStatus {
  if (file.status === "new") return "new";
  if (file.status === "pending_attach") return "from_library";
  if (file.status === "indexing" || file.status === "draft") {
    return file.status;
  }
  if (file.status === "failed") return "failed";
  if (file.kb_id) return "ready";
  return "new";
}

export function getTextAgentKbDisplayStatus(text: CustomText): AgentKbDisplayStatus {
  if (text.status === "new") return "new";
  if (text.status === "pending_attach") return "from_library";
  if (text.status === "indexing" || text.status === "draft") {
    return text.status;
  }
  if (text.status === "failed") return "failed";
  if (text.kb_id) return "ready";
  return "new";
}

export function getQnAAgentKbDisplayStatus(qna: QnA): AgentKbDisplayStatus {
  if (qna.status === "new") return "new";
  if (qna.status === "pending_attach") return "from_library";
  if (qna.status === "indexing" || qna.status === "draft") {
    return qna.status;
  }
  if (qna.status === "failed") return "failed";
  if (qna.kb_id) return "ready";
  return "new";
}

export interface AgentKbStateSlice {
  knowledgeBaseLinks: KnowledgeBaseLink[];
  knowledgeBaseFiles: FileMetadata[];
  knowledgeBaseText: CustomText[];
  knowledgeBaseQnA: QnA[];
}

function normalizeApiStatus(
  status: string | null | undefined,
): KbItemStatus | undefined {
  if (!status) return undefined;
  if (status === "indexed") return "ready";
  if (
    status === "draft" ||
    status === "indexing" ||
    status === "ready" ||
    status === "failed"
  ) {
    return status;
  }
  return undefined;
}

export function mapAttachedUrlsToLinks(
  urls: AttachedUrlItem[],
): KnowledgeBaseLink[] {
  return urls
    .map((item) => ({
      kb_id: item.kb_id,
      link: item.url,
      checked: false,
      status: "existing" as const,
      updated_at: item.updated_at ?? item.attached_at ?? null,
      api_status: normalizeApiStatus(item.status),
    }))
    .filter((row) => row.link);
}

export function mapAttachedFilesToState(
  files: AttachedFileItem[],
): FileMetadata[] {
  return files
    .map((item) => ({
      kb_id: item.kb_id,
      name: item.file_name,
      size: item.file_size ?? 0,
      type: item.file_type ?? "",
      checked: false,
      s3_key: item.file_key ?? null,
      cdn_url: null,
      status: item.status ?? "ready",
      updated_at: item.updated_at ?? item.attached_at ?? null,
    }))
    .filter((row) => row.name);
}

export function mapAttachedCustomTextsToState(
  texts: AttachedCustomTextItem[],
): CustomText[] {
  return texts
    .map((item) => ({
      kb_id: item.kb_id,
      custom_text_alias: item.custom_text_alias,
      custom_text: item.content ?? "",
      lastUpdated: item.updated_at ?? item.attached_at ?? "",
      status: item.status ?? "ready",
    }))
    .filter((row) => row.custom_text_alias);
}

export function mapAttachedQaPairsToState(qaPairs: AttachedQnAItem[]): QnA[] {
  return qaPairs
    .map((item) => ({
      kb_id: item.kb_id,
      qna_alias: item.qna_alias,
      question: item.question ?? "",
      answer: item.answer ?? "",
      lastUpdated: item.updated_at ?? item.attached_at ?? "",
      status: item.status ?? "ready",
    }))
    .filter((row) => row.qna_alias);
}

export function mapKbAttachmentsToState(
  attachments: KbAttachmentRow[] | undefined | null,
): AgentKbStateSlice {
  const rows = attachments ?? [];

  const knowledgeBaseLinks: KnowledgeBaseLink[] = rows
    .filter((row) => row.source_type === "url")
    .map((row) => ({
      kb_id: row.kb_id,
      link: row.url ?? row.title ?? "",
      checked: false,
      status: "existing",
      updated_at: row.updated_at ?? row.attached_at ?? null,
      api_status: normalizeApiStatus(row.status ?? undefined),
    }))
    .filter((row) => row.link);

  const knowledgeBaseFiles: FileMetadata[] = rows
    .filter((row) => row.source_type === "file")
    .map((row) => ({
      kb_id: row.kb_id,
      name: row.file_name ?? row.title ?? "",
      size: 0,
      type: "",
      checked: false,
      s3_key: null,
      cdn_url: null,
      status: row.status ?? "ready",
      updated_at: row.updated_at ?? row.attached_at ?? null,
    }))
    .filter((row) => row.name);

  const knowledgeBaseText: CustomText[] = rows
    .filter((row) => row.source_type === "custom_text")
    .map((row) => ({
      kb_id: row.kb_id,
      custom_text_alias: row.custom_text_alias ?? row.title ?? "",
      custom_text: "",
      lastUpdated: row.updated_at ?? row.attached_at ?? "",
      status: row.status ?? "ready",
    }))
    .filter((row) => row.custom_text_alias);

  const knowledgeBaseQnA: QnA[] = rows
    .filter((row) => row.source_type === "qa_pair")
    .map((row) => ({
      kb_id: row.kb_id,
      qna_alias: row.qna_alias ?? row.title ?? "",
      question: "",
      answer: "",
      lastUpdated: row.updated_at ?? row.attached_at ?? "",
      status: row.status ?? "ready",
    }))
    .filter((row) => row.qna_alias);

  return {
    knowledgeBaseLinks,
    knowledgeBaseFiles,
    knowledgeBaseText,
    knowledgeBaseQnA,
  };
}

export function buildKbAttachmentsFromState(
  state: AgentKbStateSlice,
): KbAttachmentInput[] {
  const attachments: KbAttachmentInput[] = [];

  for (const link of state.knowledgeBaseLinks) {
    if (
      link.kb_id &&
      (link.status === "existing" || link.status === "pending_attach")
    ) {
      attachments.push({ kb_id: link.kb_id, source_type: "url" });
    }
  }

  for (const file of state.knowledgeBaseFiles) {
    if (file.kb_id && file.status !== "new") {
      attachments.push({ kb_id: file.kb_id, source_type: "file" });
    }
  }

  for (const text of state.knowledgeBaseText) {
    if (text.kb_id && text.status !== "new") {
      attachments.push({ kb_id: text.kb_id, source_type: "custom_text" });
    }
  }

  for (const qna of state.knowledgeBaseQnA) {
    if (qna.kb_id && qna.status !== "new") {
      attachments.push({ kb_id: qna.kb_id, source_type: "qa_pair" });
    }
  }

  return attachments;
}

export function kbAttachmentSetsEqual(
  a: KbAttachmentInput[],
  b: KbAttachmentInput[],
): boolean {
  const key = (items: KbAttachmentInput[]) =>
    [...items]
      .map((item) => `${item.kb_id}:${item.source_type}`)
      .sort()
      .join("|");

  return key(a) === key(b);
}

export function mergeLinksWithPending(
  fetched: KnowledgeBaseLink[],
  current: KnowledgeBaseLink[],
): KnowledgeBaseLink[] {
  const fetchedUrls = new Set(fetched.map((l) => l.link));
  const pending = current.filter((item) => {
    if (fetchedUrls.has(item.link)) return false;
    if (item.status === "new" || item.status === "pending_attach") return true;
    if (
      item.status === "existing" &&
      (item.api_status === "indexing" || item.api_status === "draft")
    ) {
      return true;
    }
    return false;
  });
  return [...pending, ...fetched];
}

export function mergeFilesWithPending(
  fetched: FileMetadata[],
  current: FileMetadata[],
): FileMetadata[] {
  const fetchedNames = new Set(fetched.map((f) => f.name));
  const pending = current.filter((item) => {
    if (fetchedNames.has(item.name)) return false;
    if (item.status === "new" || item.status === "pending_attach") return true;
    if (item.status === "indexing" || item.status === "draft") return true;
    return false;
  });
  return [...pending, ...fetched];
}

export function mergeTextsWithPending(
  fetched: CustomText[],
  current: CustomText[],
): CustomText[] {
  const fetchedAliases = new Set(
    fetched.map((t) => t.custom_text_alias.toLowerCase()),
  );
  const pending = current.filter((item) => {
    const alias = item.custom_text_alias.toLowerCase();
    if (fetchedAliases.has(alias)) return false;
    if (item.status === "new" || item.status === "pending_attach") return true;
    if (item.status === "indexing" || item.status === "draft") return true;
    return false;
  });
  return [...pending, ...fetched];
}

export function mergeQnAWithPending(
  fetched: QnA[],
  current: QnA[],
): QnA[] {
  const fetchedAliases = new Set(
    fetched.map((q) => q.qna_alias.toLowerCase()),
  );
  const pending = current.filter((item) => {
    const alias = item.qna_alias.toLowerCase();
    if (fetchedAliases.has(alias)) return false;
    if (item.status === "new" || item.status === "pending_attach") return true;
    if (item.status === "indexing" || item.status === "draft") return true;
    return false;
  });
  return [...pending, ...fetched];
}

export function applySavedLinksToState(
  current: KnowledgeBaseLink[],
  kbAttachments?: KbAttachmentRow[] | null,
): KnowledgeBaseLink[] {
  const urlAttachments = (kbAttachments ?? []).filter(
    (row) => row.source_type === "url",
  );

  return current.map((link) => {
    if (link.status !== "new" && link.status !== "pending_attach") {
      return link;
    }

    const attachment = urlAttachments.find(
      (row) =>
        (row.url ?? row.title ?? "").toLowerCase() === link.link.toLowerCase(),
    );

    return {
      ...link,
      status: "existing",
      kb_id: attachment?.kb_id ?? link.kb_id,
      api_status:
        normalizeApiStatus(attachment?.status ?? undefined) ?? "indexing",
      updated_at:
        attachment?.attached_at ??
        attachment?.updated_at ??
        link.updated_at,
      checked: false,
    };
  });
}

export function hasIndexingKbItems(state: AgentKbStateSlice): boolean {
  const isIndexing = (status: string | undefined) =>
    status === "indexing" || status === "draft";

  return (
    state.knowledgeBaseLinks.some(
      (l) =>
        l.status === "new" ||
        isIndexing(l.api_status) ||
        isIndexing(l.status),
    ) ||
    state.knowledgeBaseFiles.some(
      (f) => f.status === "new" || isIndexing(f.status),
    ) ||
    state.knowledgeBaseText.some(
      (t) => t.status === "new" || isIndexing(t.status),
    ) ||
    state.knowledgeBaseQnA.some(
      (q) => q.status === "new" || isIndexing(q.status),
    )
  );
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): {
  pageItems: T[];
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const total = items.length;
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 0;
  const safePage = totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    pageItems,
    total,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

const EMPTY_KB_STATE: AgentKbStateSlice = {
  knowledgeBaseLinks: [],
  knowledgeBaseFiles: [],
  knowledgeBaseText: [],
  knowledgeBaseQnA: [],
};

/** Build-agent payload fields from local draft state (no existing attachments). */
export function buildAgentKbBuildFields(state: AgentKbStateSlice): ReturnType<
  typeof buildAgentKbUpdateFields
> {
  return buildAgentKbUpdateFields(EMPTY_KB_STATE, state);
}

export function buildAgentKbUpdateFields(
  initial: AgentKbStateSlice,
  current: AgentKbStateSlice,
): {
  kb_attachments?: KbAttachmentInput[];
  new_urls?: string[];
  new_custom_texts?: Array<{ custom_text_alias: string; custom_text: string }>;
  new_qa_pairs?: Array<{
    qna_alias: string;
    question: string;
    answer: string;
  }>;
} {
  const fields: ReturnType<typeof buildAgentKbUpdateFields> = {};

  const newUrls =
    current.knowledgeBaseLinks
      ?.filter(
        (link) =>
          link.checked && link.status === "new" && !link.kb_id,
      )
      ?.map((link) => link.link) ?? [];

  if (newUrls.length > 0) {
    fields.new_urls = newUrls;
  }

  const newCustomTexts =
    current.knowledgeBaseText?.filter(
      (text) => text.status === "new" && !text.kb_id,
    ) ?? [];

  if (newCustomTexts.length > 0) {
    fields.new_custom_texts = newCustomTexts.map((text) => ({
      custom_text_alias: text.custom_text_alias,
      custom_text: text.custom_text,
    }));
  }

  const newQnAPairs =
    current.knowledgeBaseQnA?.filter(
      (qna) => qna.status === "new" && !qna.kb_id,
    ) ?? [];

  if (newQnAPairs.length > 0) {
    fields.new_qa_pairs = newQnAPairs.map((qna) => ({
      qna_alias: qna.qna_alias,
      question: qna.question,
      answer: qna.answer,
    }));
  }

  const initialAttachments = buildKbAttachmentsFromState(initial);
  const currentAttachments = buildKbAttachmentsFromState(current);

  if (!kbAttachmentSetsEqual(initialAttachments, currentAttachments)) {
    fields.kb_attachments = currentAttachments;
  }

  return fields;
}
