/**
 * Application configuration constants
 */

// ─── Pagination ───────────────────────────────────────────────────────────────
export const VISITOR_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type VisitorPageSize = (typeof VISITOR_PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_VISITORS_PER_PAGE: VisitorPageSize = 25;

const VISITORS_PAGE_SIZE_STORAGE_KEY = "elysium_atlas_visitors_page_size";

export function readVisitorsPageSize(): VisitorPageSize {
  if (typeof window === "undefined") return DEFAULT_VISITORS_PER_PAGE;
  const stored = Number(localStorage.getItem(VISITORS_PAGE_SIZE_STORAGE_KEY));
  if (VISITOR_PAGE_SIZE_OPTIONS.includes(stored as VisitorPageSize)) {
    return stored as VisitorPageSize;
  }
  return DEFAULT_VISITORS_PER_PAGE;
}

export function writeVisitorsPageSize(size: VisitorPageSize) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VISITORS_PAGE_SIZE_STORAGE_KEY, String(size));
}

/** @deprecated Use readVisitorsPageSize() — kept for any legacy imports */
export const VISITORS_PER_PAGE = DEFAULT_VISITORS_PER_PAGE;
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  images: {
    background: {
      elysium:
        "https://cdn.sgdevstudio.in/elysium-atlas/assets/images/elysium-bg.webp",
    },
  },
} as const;
