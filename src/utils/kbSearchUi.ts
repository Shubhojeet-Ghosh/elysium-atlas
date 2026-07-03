export function isKbSearchInProgress(
  searchQuery: string,
  debouncedSearchQuery: string,
  isLoading: boolean,
): boolean {
  const query = searchQuery.trim();
  if (!query) return false;
  return query !== debouncedSearchQuery.trim() || isLoading;
}
