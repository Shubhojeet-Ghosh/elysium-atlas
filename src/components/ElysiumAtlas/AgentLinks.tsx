"use client";

import { useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setKnowledgeBaseLinks } from "@/store/reducers/agentSlice";
import { useAppSelector } from "@/store";
import AgentLinksList from "./AgentLinksList";
import { toast } from "sonner";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";
import { listAttachedUrls } from "@/utils/agentKbApi";
import {
  mapAttachedUrlsToLinks,
  mergeLinksWithPending,
} from "@/utils/agentKbUtils";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import {
  readDatasourcePageSize,
  writeDatasourcePageSize,
  type VisitorPageSize,
} from "@/lib/config";
import { useAgentAttachedListLoad } from "./kb/useAgentAttachedListLoad";
import { useIsKbBuildFlow } from "./kb/KbDatasourceModeContext";
import { paginateItems } from "@/utils/agentKbUtils";

export default function AgentLinks() {
  const isBuild = useIsKbBuildFlow();
  const dispatch = useDispatch();
  const readOnly = useAgentReadOnly();
  const agentID = useSelector((state: RootState) => state.agent.agentID);
  const buildLinks = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseLinks,
  );
  const knowledgeBaseLinks = useSelector(
    (state: RootState) => state.agent.knowledgeBaseLinks,
  );
  const triggerFetchAgentUrls = useAppSelector(
    (state) => state.agent.triggerFetchAgentUrls,
  );
  const triggerGetAgentDetails = useAppSelector(
    (state) => state.agent.triggerGetAgentDetails,
  );
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(() =>
    readDatasourcePageSize(),
  );
  const [buildPage, setBuildPage] = useState(1);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const knowledgeBaseLinksRef = useRef(knowledgeBaseLinks);
  const pageSizeRef = useRef(pageSize);
  const currentPageRef = useRef(currentPage);
  knowledgeBaseLinksRef.current = knowledgeBaseLinks;
  pageSizeRef.current = pageSize;
  currentPageRef.current = currentPage;

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

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

  const refreshAttachedLinks = useCallback(
    async (
      page = currentPageRef.current,
      limit = pageSizeRef.current,
      isPolling = false,
    ): Promise<boolean> => {
      if (!agentID) return false;

      if (!isPolling) setIsLoadingLinks(true);

      try {
        const response = await listAttachedUrls(agentID, page, limit);
        if (response.success) {
          const mappedLinks = mapAttachedUrlsToLinks(response.urls ?? []);
          dispatch(
            setKnowledgeBaseLinks(
              mergeLinksWithPending(
                mappedLinks,
                knowledgeBaseLinksRef.current,
              ),
            ),
          );
          applyPagination({
            total: response.total,
            page: response.page,
            total_pages: response.total_pages,
            has_next: response.has_next,
            has_prev: response.has_prev,
          });

          const hasIndexing = mappedLinks.some(
            (link) =>
              link.api_status === "indexing" || link.api_status === "draft",
          );
          if (!hasIndexing) stopPolling();
          return hasIndexing;
        }
      } catch (error: unknown) {
        if (!isPolling) {
          toast.error(
            extractApiErrorMessage(error, "Failed to fetch agent links"),
          );
        }
        stopPolling();
      } finally {
        if (!isPolling) setIsLoadingLinks(false);
      }
      return false;
    },
    [agentID, dispatch, applyPagination],
  );

  const startPollingIfNeeded = useCallback(
    (hasIndexing: boolean) => {
      if (hasIndexing && !pollingRef.current) {
        pollingRef.current = setInterval(() => {
          refreshAttachedLinks(
            currentPageRef.current,
            pageSizeRef.current,
            true,
          );
        }, 5000);
      }
    },
    [refreshAttachedLinks],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      stopPolling();
      refreshAttachedLinks(page, pageSizeRef.current).then(startPollingIfNeeded);
    },
    [refreshAttachedLinks, startPollingIfNeeded],
  );

  const handlePageSizeChange = useCallback(
    (size: VisitorPageSize) => {
      setPageSize(size);
      writeDatasourcePageSize(size);
      stopPolling();
      setCurrentPage(1);
      refreshAttachedLinks(1, size).then(startPollingIfNeeded);
    },
    [refreshAttachedLinks, startPollingIfNeeded],
  );

  useAgentAttachedListLoad(
    isBuild ? undefined : agentID,
    [triggerFetchAgentUrls, triggerGetAgentDetails],
    () => {
      setCurrentPage(1);
      refreshAttachedLinks(1, pageSizeRef.current).then(startPollingIfNeeded);
    },
    stopPolling,
  );

  if (isBuild) {
    const buildPagination = paginateItems(buildLinks, buildPage, pageSize);

    const handleBuildPageChange = (page: number) => {
      setBuildPage(page);
    };

    const handleBuildPageSizeChange = (size: VisitorPageSize) => {
      setPageSize(size);
      writeDatasourcePageSize(size);
      setBuildPage(1);
    };

    return (
      <div className="flex flex-col">
        <AgentLinksList
          isLoadingLinks={false}
          readOnly={readOnly}
          currentPage={buildPagination.totalPages > 0 ? buildPage : 1}
          totalPages={buildPagination.totalPages}
          hasNext={buildPagination.hasNext}
          hasPrev={buildPagination.hasPrev}
          total={buildPagination.total}
          pageSize={pageSize}
          onPageChange={handleBuildPageChange}
          onPageSizeChange={handleBuildPageSizeChange}
          onRefresh={async () => undefined}
          localPagination
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <AgentLinksList
        isLoadingLinks={isLoadingLinks}
        readOnly={readOnly}
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrev={hasPrev}
        total={total}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={() =>
          refreshAttachedLinks(currentPageRef.current, pageSizeRef.current)
        }
      />
    </div>
  );
}
