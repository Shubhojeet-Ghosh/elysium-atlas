"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  setBaseURL,
  addKnowledgeBaseLinks,
  setKnowledgeBaseLinks,
} from "@/store/reducers/agentSlice";
import { useAppSelector } from "@/store";
import CustomInput from "@/components/inputs/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import AgentAddSitemapDialog from "./AgentAddSitemapDialog";
import AgentLinksList from "./AgentLinksList";
import { toast } from "sonner";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { cleanAndDeduplicateLinks } from "@/utils/linkUtils";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";
import {
  readDatasourcePageSize,
  writeDatasourcePageSize,
  VISITOR_PAGE_SIZE_OPTIONS,
  type VisitorPageSize,
} from "@/lib/config";
import { KnowledgeBaseLink } from "@/store/types/AgentBuilderTypes";

export default function AgentLinks() {
  const dispatch = useDispatch();
  const readOnly = useAgentReadOnly();
  const baseURL = useSelector((state: RootState) => state.agent.baseURL);
  const agentID = useSelector((state: RootState) => state.agent.agentID);
  const knowledgeBaseLinks = useSelector(
    (state: RootState) => state.agent.knowledgeBaseLinks,
  );
  const triggerFetchAgentUrls = useAppSelector(
    (state) => state.agent.triggerFetchAgentUrls,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(() =>
    readDatasourcePageSize(),
  );
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pageSizeRef = useRef(pageSize);
  const currentPageRef = useRef(currentPage);
  const knowledgeBaseLinksRef = useRef(knowledgeBaseLinks);
  pageSizeRef.current = pageSize;
  currentPageRef.current = currentPage;
  knowledgeBaseLinksRef.current = knowledgeBaseLinks;

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const validateURL = (url: string): boolean => {
    if (!url || url.trim() === "") {
      return false;
    }
    return url.trim().length > 0;
  };

  const mergeWithNewLinks = useCallback((mappedLinks: KnowledgeBaseLink[]) => {
    const fetchedUrls = new Set(mappedLinks.map((l) => l.link));
    const newItems = knowledgeBaseLinksRef.current.filter(
      (item) => item.status === "new" && !fetchedUrls.has(item.link),
    );
    return [...newItems, ...mappedLinks];
  }, []);

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

  const fetchAgentLinks = useCallback(
    async (
      page = currentPageRef.current,
      limit = pageSizeRef.current,
      isPolling = false,
    ): Promise<boolean> => {
      if (!agentID) return false;

      if (!isPolling) setIsLoadingLinks(true);
      const token = Cookies.get("elysium_atlas_session_token");

      try {
        const response = await fastApiAxios.post(
          "/elysium-agents/elysium-atlas/agent/v1/get-agent-urls",
          {
            agent_id: agentID,
            page,
            limit,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success === true) {
          const urls = response.data.urls || [];
          const mappedLinks = urls.map((urlItem: any) => ({
            link: urlItem.url,
            checked: false,
            status: "existing" as const,
            updated_at: urlItem.updated_at ?? null,
            api_status: urlItem.status ?? undefined,
          }));

          dispatch(setKnowledgeBaseLinks(mergeWithNewLinks(mappedLinks)));
          applyPagination({
            total: response.data.total ?? 0,
            page: response.data.page ?? page,
            total_pages: response.data.total_pages ?? 0,
            has_next: response.data.has_next ?? false,
            has_prev: response.data.has_prev ?? false,
          });

          const hasIndexing = mappedLinks.some(
            (l: KnowledgeBaseLink) => l.api_status === "indexing",
          );
          if (!hasIndexing) stopPolling();
          return hasIndexing;
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch agent links";
        if (!isPolling) toast.error(errorMessage);
        stopPolling();
      } finally {
        if (!isPolling) setIsLoadingLinks(false);
      }
      return false;
    },
    [agentID, dispatch, mergeWithNewLinks, applyPagination],
  );

  const startPollingIfNeeded = useCallback(
    (hasIndexing: boolean) => {
      if (hasIndexing && !pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchAgentLinks(
            currentPageRef.current,
            pageSizeRef.current,
            true,
          );
        }, 5000);
      }
    },
    [fetchAgentLinks],
  );

  useEffect(() => {
    if (!agentID) return;
    setCurrentPage(1);
    fetchAgentLinks(1, pageSizeRef.current).then(startPollingIfNeeded);
    return () => stopPolling();
  }, [agentID, fetchAgentLinks, startPollingIfNeeded]);

  useEffect(() => {
    if (!agentID || triggerFetchAgentUrls === 0) return;
    stopPolling();
    setCurrentPage(1);
    fetchAgentLinks(1, pageSizeRef.current).then(startPollingIfNeeded);
  }, [triggerFetchAgentUrls, agentID, fetchAgentLinks, startPollingIfNeeded]);

  const handlePageChange = useCallback(
    (page: number) => {
      stopPolling();
      fetchAgentLinks(page, pageSizeRef.current).then(startPollingIfNeeded);
    },
    [fetchAgentLinks, startPollingIfNeeded],
  );

  const handlePageSizeChange = useCallback(
    (size: VisitorPageSize) => {
      setPageSize(size);
      writeDatasourcePageSize(size);
      stopPolling();
      setCurrentPage(1);
      fetchAgentLinks(1, size).then(startPollingIfNeeded);
    },
    [fetchAgentLinks, startPollingIfNeeded],
  );

  const handleExtractLinks = async () => {
    if (!validateURL(baseURL)) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsLoading(true);
    const token = Cookies.get("elysium_atlas_session_token");

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/v1/extract-url-links",
        {
          source: "url",
          link: baseURL,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success === true) {
        const responseLinks = response.data.links || [];

        const normalized_base_url = response.data.base_url || baseURL;
        dispatch(setBaseURL(normalized_base_url));

        const cleanedLinks = cleanAndDeduplicateLinks(responseLinks);

        const existingLinksSet = new Set(
          knowledgeBaseLinks.map((item) => item.link),
        );
        const uniqueNewLinks = cleanedLinks.filter(
          (link) => !existingLinksSet.has(link),
        );

        if (uniqueNewLinks.length > 0) {
          dispatch(
            addKnowledgeBaseLinks({ links: uniqueNewLinks, checked: true }),
          );
          toast.success(
            response.data.message ||
              `Successfully extracted ${uniqueNewLinks.length} new unique links from URL`,
          );
        } else {
          toast.info(
            "All extracted links are already in the list or were filtered out",
          );
        }
      } else {
        toast.error(
          response.data.message || "Failed to extract links from URL",
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to extract links from URL. Please check the URL and try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="lg:text-[14px] text-[12px] font-bold mt-[4px]">
        Base Website Link
      </div>
      <div className="flex items-center gap-3 mt-[4px]">
        <CustomInput
          type="url"
          placeholder="Enter base website URL (e.g., https://example.com)"
          value={baseURL}
          onChange={(e) => dispatch(setBaseURL(e.target.value))}
          className="flex-1 px-[12px] py-[10px]"
          disabled={readOnly}
        />
        {!readOnly && (
          <>
            <PrimaryButton
              className="text-[12px] font-semibold flex items-center justify-center gap-2 min-w-[110px] min-h-[41px] shrink-0"
              onClick={handleExtractLinks}
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner className="border-white dark:border-deep-onyx" />
              ) : (
                <span>Extract Links</span>
              )}
            </PrimaryButton>
            <AgentAddSitemapDialog />
          </>
        )}
      </div>
      <div className="mt-[2px]">
        <AgentLinksList
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
        />
      </div>
    </div>
  );
}
