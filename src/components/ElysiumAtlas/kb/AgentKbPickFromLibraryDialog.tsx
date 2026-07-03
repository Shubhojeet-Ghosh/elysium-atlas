"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import CustomInput from "@/components/inputs/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import TablePaginationControls from "../TablePaginationControls";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  DEFAULT_DATASOURCE_PAGE_SIZE,
  VISITOR_PAGE_SIZE_OPTIONS,
  type VisitorPageSize,
} from "@/lib/config";
import {
  listCustomTexts,
  listFiles,
  listQnAPairs,
  listUrls,
  searchKbItems,
} from "@/utils/kbItemsApi";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import { highlightKbSearchMatch } from "@/utils/kbSearchHighlight";
import { isKbSearchInProgress } from "@/utils/kbSearchUi";
import type { KbSearchSourceType } from "@/types/kbItems";

export interface AgentKbLibraryPick {
  kb_id: string;
  label: string;
  sublabel?: string;
}

interface AgentKbPickFromLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceType: KbSearchSourceType;
  excludeKbIds?: string[];
  onConfirm: (items: AgentKbLibraryPick[]) => void;
}

function mapResponseItems(
  sourceType: KbSearchSourceType,
  response: {
    urls?: { kb_id: string; url: string }[];
    files?: { kb_id: string; file_name: string }[];
    custom_texts?: { kb_id: string; custom_text_alias: string }[];
    qa_pairs?: { kb_id: string; qna_alias: string }[];
  },
): AgentKbLibraryPick[] {
  if (sourceType === "url") {
    const urls = "urls" in response ? (response.urls ?? []) : [];
    return urls.map((item) => ({
      kb_id: item.kb_id,
      label: item.url,
    }));
  }

  if (sourceType === "file") {
    const files = "files" in response ? (response.files ?? []) : [];
    return files.map((item) => ({
      kb_id: item.kb_id,
      label: item.file_name,
    }));
  }

  if (sourceType === "custom_text") {
    const texts =
      "custom_texts" in response ? (response.custom_texts ?? []) : [];
    return texts.map((item) => ({
      kb_id: item.kb_id,
      label: item.custom_text_alias,
    }));
  }

  const qaPairs = "qa_pairs" in response ? (response.qa_pairs ?? []) : [];
  return qaPairs.map((item) => ({
    kb_id: item.kb_id,
    label: item.qna_alias,
  }));
}

export default function AgentKbPickFromLibraryDialog({
  open,
  onOpenChange,
  sourceType,
  excludeKbIds = [],
  onConfirm,
}: AgentKbPickFromLibraryDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [items, setItems] = useState<AgentKbLibraryPick[]>([]);
  const [selectedById, setSelectedById] = useState<
    Map<string, AgentKbLibraryPick>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(
    DEFAULT_DATASOURCE_PAGE_SIZE,
  );
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);

  const excludedSet = useMemo(() => new Set(excludeKbIds), [excludeKbIds]);
  const pageStartApiPageRef = useRef<Map<number, number>>(new Map([[1, 1]]));
  const fetchGenerationRef = useRef(0);

  const isSearchActive = debouncedSearch.trim().length > 0;
  const isSearching = isKbSearchInProgress(
    searchQuery,
    debouncedSearch,
    isLoading,
  );
  const displayItems = isSearching ? [] : items;

  const resetPaginationCursors = useCallback(() => {
    pageStartApiPageRef.current = new Map([[1, 1]]);
  }, []);

  const loadItems = useCallback(
    async (page: number) => {
      const generation = ++fetchGenerationRef.current;
      setIsLoading(true);
      try {
        const query = debouncedSearch.trim();
        let apiPage = pageStartApiPageRef.current.get(page) ?? page;
        let visibleItems: AgentKbLibraryPick[] = [];
        let lastResponse: {
          success: boolean;
          message?: string;
          total: number;
          total_pages: number;
          has_next: boolean;
        } | null = null;

        while (visibleItems.length < pageSize) {
          const response = query
            ? await searchKbItems(sourceType, query, apiPage, pageSize)
            : sourceType === "url"
              ? await listUrls(apiPage, pageSize)
              : sourceType === "file"
                ? await listFiles(apiPage, pageSize)
                : sourceType === "custom_text"
                  ? await listCustomTexts(apiPage, pageSize)
                  : await listQnAPairs(apiPage, pageSize);

          lastResponse = response;

          if (!response.success) {
            if (generation !== fetchGenerationRef.current) return;
            toast.error(response.message || "Failed to load library items");
            setItems([]);
            setTotal(0);
            setTotalPages(0);
            setHasNext(false);
            setHasPrev(false);
            return;
          }

          const mapped = mapResponseItems(sourceType, response).filter(
            (item) => item.kb_id && item.label && !excludedSet.has(item.kb_id),
          );

          visibleItems = [...visibleItems, ...mapped];

          if (!response.has_next) {
            break;
          }

          if (visibleItems.length >= pageSize) {
            break;
          }

          apiPage += 1;
        }

        const pageItems = visibleItems.slice(0, pageSize);
        pageStartApiPageRef.current.set(page + 1, apiPage + 1);

        if (generation !== fetchGenerationRef.current) return;

        setItems(pageItems);
        setTotal(lastResponse?.total ?? 0);
        setTotalPages(
          lastResponse && lastResponse.total_pages > 0
            ? lastResponse.total_pages
            : lastResponse && lastResponse.total > 0
              ? Math.max(1, Math.ceil(lastResponse.total / pageSize))
              : 0,
        );
        setHasNext(
          visibleItems.length > pageSize || Boolean(lastResponse?.has_next),
        );
        setHasPrev(page > 1);
      } catch (error: unknown) {
        if (generation !== fetchGenerationRef.current) return;
        toast.error(
          extractApiErrorMessage(error, "Failed to load library items"),
        );
        setItems([]);
        setTotal(0);
        setTotalPages(0);
        setHasNext(false);
        setHasPrev(false);
      } finally {
        if (generation === fetchGenerationRef.current) {
          setIsLoading(false);
        }
      }
    },
    [debouncedSearch, excludedSet, pageSize, sourceType],
  );

  const handlePageSizeChange = (size: VisitorPageSize) => {
    setPageSize(size);
    resetPaginationCursors();
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!open) return;
    loadItems(currentPage);
  }, [open, currentPage, loadItems]);

  useEffect(() => {
    if (!open) return;
    resetPaginationCursors();
    setCurrentPage(1);
  }, [debouncedSearch, open, resetPaginationCursors]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedById(new Map());
      setCurrentPage(1);
      setPageSize(DEFAULT_DATASOURCE_PAGE_SIZE);
      resetPaginationCursors();
    }
  }, [open, resetPaginationCursors]);

  const toggleItem = (item: AgentKbLibraryPick) => {
    setSelectedById((prev) => {
      const next = new Map(prev);
      if (next.has(item.kb_id)) {
        next.delete(item.kb_id);
      } else {
        next.set(item.kb_id, item);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = Array.from(selectedById.values());
    if (selected.length === 0) {
      toast.error("Select at least one item from the library");
      return;
    }
    onConfirm(selected);
    onOpenChange(false);
  };

  const selectedCount = selectedById.size;

  const typeLabel =
    sourceType === "url"
      ? "links"
      : sourceType === "file"
        ? "files"
        : sourceType === "custom_text"
          ? "text entries"
          : "Q&A entries";

  const emptyItemsMessage = isSearchActive
    ? `No ${typeLabel} found matching "${debouncedSearch.trim()}"`
    : `No available ${typeLabel} found`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[560px] overflow-hidden">
        <div className="min-w-0 flex flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add from library</DialogTitle>
          <DialogDescription>
            Attach existing {typeLabel} from the library to this agent. Library
            items are indexed once and linked here without re-embedding.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[41px] min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <CustomInput
            type="text"
            placeholder={`Search ${typeLabel}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[41px] min-h-[41px] pl-9 pr-3 text-[12px]"
          />
        </div>

        <div className="min-h-[320px] max-h-[360px] overflow-y-auto overflow-x-hidden min-w-0">
          {isSearching ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <Spinner className="border-serene-purple dark:border-pure-mist" />
              <p className="text-[12px] text-gray-500 dark:text-gray-400">
                Searching &apos;{searchQuery.trim()}&apos;
              </p>
            </div>
          ) : isLoading && displayItems.length === 0 ? (
            <div className="py-12 flex justify-center">
              <Spinner className="border-serene-purple dark:border-pure-mist" />
            </div>
          ) : displayItems.length === 0 ? (
            <p className="py-12 text-center text-[12px] text-gray-500 dark:text-gray-400">
              {emptyItemsMessage}
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5 min-w-0">
              {displayItems.map((item) => (
                <li key={item.kb_id} className="min-w-0">
                  <label className="flex items-start gap-3 min-w-0 px-1 py-2.5 cursor-pointer rounded-md hover:bg-serene-purple/5 dark:hover:bg-serene-purple/10 transition-colors">
                    <Checkbox
                      checked={selectedById.has(item.kb_id)}
                      onCheckedChange={() => toggleItem(item)}
                      className="mt-0.5 shrink-0 border-2 border-gray-300 dark:border-gray-500 data-[state=checked]:border-serene-purple data-[state=checked]:bg-serene-purple data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                    />
                    <span className="min-w-0 flex-1 text-[12px] font-medium text-deep-onyx dark:text-pure-mist break-all leading-snug">
                      {highlightKbSearchMatch(item.label, debouncedSearch.trim())}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0 overflow-x-auto">
        <TablePaginationControls
          currentPage={totalPages > 0 ? currentPage : 1}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          total={total}
          pageSize={pageSize}
          pageSizeOptions={VISITOR_PAGE_SIZE_OPTIONS}
          isLoading={isLoading || isSearching}
          showPageJump={false}
          pageSizeSelectSide="top"
          pageSizeControlsClassName="flex items-center gap-2"
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
          className="mt-1 mb-0 px-0"
        />
        </div>

        <DialogFooter className="min-w-0">
          <DialogClose asChild>
            <PrimaryButton className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx">
              Cancel
            </PrimaryButton>
          </DialogClose>
          <PrimaryButton
            className="text-[12px] font-semibold min-w-[100px]"
            onClick={handleConfirm}
            disabled={selectedCount === 0}
          >
            Attach selected
            {selectedCount > 0 ? ` (${selectedCount})` : ""}
          </PrimaryButton>
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
