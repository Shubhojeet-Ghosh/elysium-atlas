"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  readDatasourcePageSize,
  writeDatasourcePageSize,
  VISITOR_PAGE_SIZE_OPTIONS,
  type VisitorPageSize,
} from "@/lib/config";

export function useClientSideTablePagination<T>(items: T[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<VisitorPageSize>(() =>
    readDatasourcePageSize(),
  );

  const total = items.length;
  const totalPages =
    total > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 0;
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: VisitorPageSize) => {
    setPageSize(size);
    writeDatasourcePageSize(size);
    setCurrentPage(1);
  };

  const resetPage = useCallback(() => setCurrentPage(1), []);

  return {
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    total,
    pageSize,
    pageSizeOptions: VISITOR_PAGE_SIZE_OPTIONS,
    paginatedItems,
    handlePageChange,
    handlePageSizeChange,
    resetPage,
  };
}
