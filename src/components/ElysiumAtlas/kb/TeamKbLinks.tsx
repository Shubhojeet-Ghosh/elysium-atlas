"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import TeamKbLinksList from "./TeamKbLinksList";
import { useKbListPolling } from "./useKbListPolling";
import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";
import { canManageTeamMembers } from "@/utils/teamPermissions";
import { listUrls, createUrls, searchKbItems } from "@/utils/kbItemsApi";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import { useKbPendingRegistration } from "./KbPendingChangesContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { KbItemStatus } from "@/types/kbItems";
import {
  readDatasourcePageSize,
  writeDatasourcePageSize,
  VISITOR_PAGE_SIZE_OPTIONS,
  type VisitorPageSize,
} from "@/lib/config";

export interface TeamKbLinkRow {
  url: string;
  kb_id?: string;
  checked: boolean;
  status: "new" | "existing";
  api_status?: KbItemStatus;
  updated_at?: string | null;
}

export default function TeamKbLinks() {
  const teamRole = useActiveTeamRole();
  const readOnly = !canManageTeamMembers(teamRole);

  const [links, setLinks] = useState<TeamKbLinkRow[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(() =>
    readDatasourcePageSize(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const pageSizeRef = useRef(pageSize);
  const currentPageRef = useRef(currentPage);
  const linksRef = useRef(links);
  const searchQueryRef = useRef(debouncedSearchQuery);
  const stopPollingRef = useRef<() => void>(() => {});
  pageSizeRef.current = pageSize;
  currentPageRef.current = currentPage;
  linksRef.current = links;
  searchQueryRef.current = debouncedSearchQuery.trim();

  const mergeWithPendingLinks = useCallback(
    (mapped: TeamKbLinkRow[], activeSearch: string) => {
      if (activeSearch) {
        return mapped;
      }

      const fetchedUrls = new Set(mapped.map((l) => l.url));
      const pending = linksRef.current.filter(
        (item) => item.status === "new" && !fetchedUrls.has(item.url),
      );

      return [...pending, ...mapped];
    },
    [],
  );

  const applyPagination = useCallback(
    (payload: {
      total: number;
      page: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    }) => {
      setCurrentPage(payload.page);
      setTotal(payload.total);
      setHasNext(payload.has_next);
      setHasPrev(payload.has_prev);
      setTotalPages(
        payload.total_pages > 0
          ? payload.total_pages
          : payload.total > 0
            ? Math.max(1, Math.ceil(payload.total / pageSizeRef.current))
            : 0,
      );
    },
    [],
  );

  const fetchLinks = useCallback(
    async (
      page = currentPageRef.current,
      limit = pageSizeRef.current,
      isPolling = false,
    ): Promise<boolean> => {
      if (!isPolling) setIsLoadingLinks(true);

      const activeSearch = searchQueryRef.current;

      try {
        const response = activeSearch
          ? await searchKbItems("url", activeSearch, page, limit)
          : await listUrls(page, limit);

        if (response.success) {
          const mappedLinks: TeamKbLinkRow[] = (response.urls ?? []).map(
            (item) => ({
              url: item.url,
              kb_id: item.kb_id,
              checked: false,
              status: "existing" as const,
              api_status: item.status,
              updated_at: item.updated_at ?? null,
            }),
          );

          setLinks(mergeWithPendingLinks(mappedLinks, activeSearch));
          applyPagination({
            total: response.total ?? 0,
            page: response.page ?? page,
            total_pages: response.total_pages ?? 0,
            has_next: response.has_next ?? false,
            has_prev: response.has_prev ?? false,
          });

          const hasIndexing =
            !activeSearch &&
            mappedLinks.some(
              (l) => l.api_status === "indexing" || l.api_status === "draft",
            );
          if (!hasIndexing) stopPollingRef.current();
          return hasIndexing;
        }

        if (!isPolling) {
          toast.error(response.message || "Failed to fetch links");
        }
        stopPollingRef.current();
        return false;
      } catch (error: unknown) {
        if (!isPolling) {
          toast.error(extractApiErrorMessage(error, "Failed to fetch links"));
        }
        stopPollingRef.current();
        return false;
      } finally {
        if (!isPolling) setIsLoadingLinks(false);
      }
    },
    [mergeWithPendingLinks, applyPagination],
  );

  const { refresh, stopPolling, startPollingIfNeeded } = useKbListPolling(
    (isPolling) =>
      fetchLinks(currentPageRef.current, pageSizeRef.current, isPolling),
    [],
  );
  stopPollingRef.current = stopPolling;

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      stopPolling();
      setLinks((prev) => prev.filter((item) => item.status === "new"));
      if (!query.trim()) {
        setCurrentPage(1);
      }
    },
    [stopPolling],
  );

  const prevDebouncedSearchRef = useRef(debouncedSearchQuery);
  useEffect(() => {
    if (prevDebouncedSearchRef.current === debouncedSearchQuery) return;
    prevDebouncedSearchRef.current = debouncedSearchQuery;

    stopPolling();
    setCurrentPage(1);
    fetchLinks(1, pageSizeRef.current).then((hasIndexing) => {
      if (!searchQueryRef.current) {
        startPollingIfNeeded(hasIndexing);
      }
    });
  }, [
    debouncedSearchQuery,
    fetchLinks,
    startPollingIfNeeded,
    stopPolling,
  ]);

  const handlePageChange = useCallback(
    (page: number) => {
      stopPolling();
      fetchLinks(page, pageSizeRef.current).then(startPollingIfNeeded);
    },
    [fetchLinks, startPollingIfNeeded, stopPolling],
  );

  const handlePageSizeChange = useCallback(
    (size: VisitorPageSize) => {
      setPageSize(size);
      writeDatasourcePageSize(size);
      stopPolling();
      setCurrentPage(1);
      fetchLinks(1, size).then(startPollingIfNeeded);
    },
    [fetchLinks, startPollingIfNeeded, stopPolling],
  );

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const getCheckedPendingLinks = useCallback(
    () =>
      linksRef.current.filter(
        (item) => item.status === "new" && item.checked,
      ),
    [],
  );

  const indexPendingLinks = useCallback(async () => {
    const pendingUrls = getCheckedPendingLinks().map((item) => item.url);

    if (pendingUrls.length === 0) return;

    const response = await createUrls(pendingUrls);
    if (response.success) {
      toast.success(
        response.message ||
          `Indexing started for ${pendingUrls.length} link${pendingUrls.length === 1 ? "" : "s"}.`,
      );
      setLinks((prev) =>
        prev.filter((item) => !pendingUrls.includes(item.url)),
      );
      handleRefresh();
    } else {
      toast.error(response.message || "Failed to index links");
      throw new Error(response.message || "Failed to index links");
    }
  }, [getCheckedPendingLinks, handleRefresh]);

  const clearPendingLinks = useCallback(() => {
    setLinks((prev) => prev.filter((item) => item.status !== "new"));
  }, []);

  const notifyPendingChange = useKbPendingRegistration(
    "links",
    {
      hasPending: () => getCheckedPendingLinks().length > 0,
      getPendingCount: () => getCheckedPendingLinks().length,
      onIndex: indexPendingLinks,
      onClear: clearPendingLinks,
    },
    [links, indexPendingLinks, clearPendingLinks, getCheckedPendingLinks],
  );

  useEffect(() => {
    notifyPendingChange();
  }, [links, notifyPendingChange]);

  const addPendingLinks = useCallback((newUrls: string[]) => {
    setLinks((prev) => {
      const existingSet = new Set(prev.map((item) => item.url));
      const uniqueNew = newUrls.filter((url) => !existingSet.has(url));
      if (uniqueNew.length === 0) return prev;

      const pendingRows: TeamKbLinkRow[] = uniqueNew.map((url) => ({
        url,
        checked: true,
        status: "new",
        updated_at: null,
      }));
      return [...pendingRows, ...prev];
    });
  }, []);

  const handleBulkLinksAdded = useCallback(
    (newUrls: string[]) => {
      addPendingLinks(newUrls);
    },
    [addPendingLinks],
  );

  return (
    <div className="flex flex-col">
      <TeamKbLinksList
        links={links}
        onLinksChange={setLinks}
        onBulkLinksAdded={handleBulkLinksAdded}
          searchQuery={searchQuery}
          debouncedSearchQuery={debouncedSearchQuery}
          onSearchChange={handleSearchChange}
          isSearchActive={Boolean(debouncedSearchQuery.trim())}
          isLoadingLinks={isLoadingLinks}
          readOnly={readOnly}
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          total={total}
          pageSize={pageSize}
          pageSizeOptions={VISITOR_PAGE_SIZE_OPTIONS}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onRefresh={handleRefresh}
      />
    </div>
  );
}
