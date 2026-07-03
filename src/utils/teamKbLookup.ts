import { getCustomText, getQnAPair, searchKbItems } from "@/utils/kbItemsApi";
import { normalizeUrlForKbMatch } from "@/utils/linkUtils";
import type { KbItemStatus } from "@/types/kbItems";
import type {
  CustomText,
  FileMetadata,
  KnowledgeBaseLink,
  QnA,
} from "@/store/types/AgentBuilderTypes";

export interface TeamKbMatch {
  kb_id: string;
  status: KbItemStatus;
}

export interface TeamCustomTextMatch extends TeamKbMatch {
  custom_text_alias: string;
  content?: string;
}

export interface TeamQnAMatch extends TeamKbMatch {
  qna_alias: string;
  question?: string;
  answer?: string;
}

const URL_SEARCH_PAGE_SIZE = 50;
const URL_LOOKUP_BATCH_SIZE = 10;

function urlLookupKey(url: string): string {
  return normalizeUrlForKbMatch(url.trim()).toLowerCase();
}

function getUrlHostname(url: string): string | null {
  try {
    const hostname = new URL(url.trim()).hostname;
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch {
    return null;
  }
}

async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

async function searchExact<T>(
  sourceType: "url" | "file" | "custom_text" | "qa_pair",
  query: string,
  pickMatch: (
    response: Awaited<ReturnType<typeof searchKbItems>>,
  ) => T | undefined,
): Promise<T | null> {
  if (!query.trim()) return null;

  try {
    const response = await searchKbItems(sourceType, query, 1, 20);
    if (!response.success) return null;
    return pickMatch(response) ?? null;
  } catch {
    return null;
  }
}

async function fetchLibraryUrlIndexForHostname(
  hostname: string,
): Promise<Map<string, TeamKbMatch>> {
  const index = new Map<string, TeamKbMatch>();
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await searchKbItems(
      "url",
      hostname,
      page,
      URL_SEARCH_PAGE_SIZE,
    );
    if (!response.success) break;

    for (const item of response.urls ?? []) {
      const key = urlLookupKey(item.url);
      if (!index.has(key)) {
        index.set(key, { kb_id: item.kb_id, status: item.status });
      }
    }

    hasNext = Boolean(response.has_next);
    page += 1;
  }

  return index;
}

async function fetchLibraryUrlIndex(
  urls: string[],
): Promise<Map<string, TeamKbMatch>> {
  const hostnames = [
    ...new Set(
      urls.map(getUrlHostname).filter((hostname): hostname is string =>
        Boolean(hostname),
      ),
    ),
  ];

  const merged = new Map<string, TeamKbMatch>();

  for (let i = 0; i < hostnames.length; i += URL_LOOKUP_BATCH_SIZE) {
    const batch = hostnames.slice(i, i + URL_LOOKUP_BATCH_SIZE);
    const batchIndexes = await Promise.all(
      batch.map((hostname) => fetchLibraryUrlIndexForHostname(hostname)),
    );

    for (const index of batchIndexes) {
      for (const [key, match] of index) {
        if (!merged.has(key)) {
          merged.set(key, match);
        }
      }
    }
  }

  return merged;
}

async function findTeamUrlByDirectSearch(
  url: string,
): Promise<TeamKbMatch | null> {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const targetKey = urlLookupKey(trimmed);
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    try {
      const response = await searchKbItems(
        "url",
        trimmed,
        page,
        URL_SEARCH_PAGE_SIZE,
      );
      if (!response.success) return null;

      const match = response.urls?.find(
        (item) => urlLookupKey(item.url) === targetKey,
      );
      if (match) {
        return { kb_id: match.kb_id, status: match.status };
      }

      hasNext = Boolean(response.has_next);
      page += 1;
    } catch {
      return null;
    }
  }

  return null;
}

export async function findTeamUrl(url: string): Promise<TeamKbMatch | null> {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const hostname = getUrlHostname(trimmed);
  if (hostname) {
    const index = await fetchLibraryUrlIndexForHostname(hostname);
    const match = index.get(urlLookupKey(trimmed));
    if (match) return match;
  }

  return findTeamUrlByDirectSearch(trimmed);
}

export async function findTeamFile(
  fileName: string,
): Promise<TeamKbMatch | null> {
  const name = fileName.trim();
  return searchExact("file", name, (response) => {
    const match = response.files?.find(
      (item) => item.file_name.toLowerCase() === name.toLowerCase(),
    );
    return match ? { kb_id: match.kb_id, status: match.status } : undefined;
  });
}

export async function findTeamCustomTextByAlias(
  alias: string,
): Promise<TeamCustomTextMatch | null> {
  const trimmed = alias.trim();
  const base = await searchExact("custom_text", trimmed, (response) => {
    const match = response.custom_texts?.find(
      (item) => item.custom_text_alias.toLowerCase() === trimmed.toLowerCase(),
    );
    return match
      ? {
          kb_id: match.kb_id,
          status: match.status,
          custom_text_alias: match.custom_text_alias,
        }
      : undefined;
  });

  if (!base) return null;

  try {
    const detail = await getCustomText(base.kb_id);
    return {
      ...base,
      content: detail.custom_text?.content,
    };
  } catch {
    return base;
  }
}

export async function findTeamQnAByAlias(
  alias: string,
): Promise<TeamQnAMatch | null> {
  const trimmed = alias.trim();
  const base = await searchExact("qa_pair", trimmed, (response) => {
    const match = response.qa_pairs?.find(
      (item) => item.qna_alias.toLowerCase() === trimmed.toLowerCase(),
    );
    return match
      ? {
          kb_id: match.kb_id,
          status: match.status,
          qna_alias: match.qna_alias,
        }
      : undefined;
  });

  if (!base) return null;

  try {
    const detail = await getQnAPair(base.kb_id);
    return {
      ...base,
      question: detail.qa_pair?.question,
      answer: detail.qa_pair?.answer,
    };
  } catch {
    return base;
  }
}

export function isOnAgentListByUrl(
  links: KnowledgeBaseLink[],
  url: string,
): boolean {
  const key = urlLookupKey(url);
  return links.some((item) => urlLookupKey(item.link) === key);
}

export function isOnAgentListByFileName(
  files: FileMetadata[],
  fileName: string,
): boolean {
  return files.some(
    (item) => item.name.toLowerCase() === fileName.toLowerCase(),
  );
}

export function isOnAgentListByTextAlias(
  texts: CustomText[],
  alias: string,
): boolean {
  return texts.some(
    (item) =>
      item.custom_text_alias.toLowerCase() === alias.trim().toLowerCase(),
  );
}

export function isOnAgentListByQnAlias(qnas: QnA[], alias: string): boolean {
  return qnas.some(
    (item) => item.qna_alias.toLowerCase() === alias.trim().toLowerCase(),
  );
}

function toPendingAttachLink(
  url: string,
  libraryMatch: TeamKbMatch,
): KnowledgeBaseLink {
  return {
    kb_id: libraryMatch.kb_id,
    link: normalizeUrlForKbMatch(url),
    checked: true,
    status: "pending_attach",
    updated_at: null,
    api_status: libraryMatch.status,
  };
}

function toNewLink(url: string): KnowledgeBaseLink {
  return {
    link: normalizeUrlForKbMatch(url),
    checked: true,
    status: "new",
    updated_at: null,
  };
}

export async function resolveLinkForAgentAdd(
  normalizedUrl: string,
): Promise<{ row: KnowledgeBaseLink; reusedFromLibrary: boolean }> {
  const libraryMatch = await findTeamUrl(normalizedUrl);

  if (libraryMatch) {
    return {
      reusedFromLibrary: true,
      row: toPendingAttachLink(normalizedUrl, libraryMatch),
    };
  }

  return {
    reusedFromLibrary: false,
    row: toNewLink(normalizedUrl),
  };
}

export async function resolveLinksForAgentAdd(urls: string[]): Promise<{
  rows: KnowledgeBaseLink[];
  libraryCount: number;
  newCount: number;
}> {
  if (urls.length === 0) {
    return { rows: [], libraryCount: 0, newCount: 0 };
  }

  const libraryIndex = await fetchLibraryUrlIndex(urls);
  const matchByUrl = new Map<string, TeamKbMatch>();

  for (const url of urls) {
    const match = libraryIndex.get(urlLookupKey(url));
    if (match) {
      matchByUrl.set(url, match);
    }
  }

  const unmatchedUrls = urls.filter((url) => !matchByUrl.has(url));
  if (unmatchedUrls.length > 0) {
    const fallbackMatches = await processInBatches(
      unmatchedUrls,
      URL_LOOKUP_BATCH_SIZE,
      async (url) => ({
        url,
        match: await findTeamUrlByDirectSearch(url),
      }),
    );

    for (const { url, match } of fallbackMatches) {
      if (match) {
        matchByUrl.set(url, match);
      }
    }
  }

  const results = urls.map((url) => {
    const libraryMatch = matchByUrl.get(url);
    if (libraryMatch) {
      return {
        reusedFromLibrary: true,
        row: toPendingAttachLink(url, libraryMatch),
      };
    }
    return {
      reusedFromLibrary: false,
      row: toNewLink(url),
    };
  });

  return {
    rows: results.map((result) => result.row),
    libraryCount: results.filter((result) => result.reusedFromLibrary).length,
    newCount: results.filter((result) => !result.reusedFromLibrary).length,
  };
}

export async function resolveFileForAgentAdd(
  file: File,
): Promise<{ row: FileMetadata; reusedFromLibrary: boolean }> {
  const libraryMatch = await findTeamFile(file.name);

  if (libraryMatch) {
    return {
      reusedFromLibrary: true,
      row: {
        kb_id: libraryMatch.kb_id,
        name: file.name,
        size: file.size,
        type: file.type,
        checked: true,
        s3_key: null,
        cdn_url: null,
        status: "pending_attach",
        updated_at: null,
      },
    };
  }

  return {
    reusedFromLibrary: false,
    row: {
      name: file.name,
      size: file.size,
      type: file.type,
      checked: true,
      status: "new",
      s3_key: null,
      cdn_url: null,
    },
  };
}

export const LIBRARY_REUSE_TOAST = {
  link: "This link is already in your team library. It will be attached to this agent without re-indexing.",
  file: "A file with this name already exists in your team library. It will be attached without re-indexing or re-uploading.",
  text: "This alias already exists in your team library. It will be attached without re-indexing.",
  qna: "This alias already exists in your team library. It will be attached without re-indexing.",
  textContentMismatch:
    "This alias already exists in the team library with different content. Saving will attach the existing library entry- your text here will not update the library item. Edit it in Knowledge Base or use a different alias.",
  qnaContentMismatch:
    "This alias already exists in the team library with different question/answer. Saving will attach the existing library entry- your entries here will not update the library item. Edit it in Knowledge Base or use a different alias.",
} as const;
