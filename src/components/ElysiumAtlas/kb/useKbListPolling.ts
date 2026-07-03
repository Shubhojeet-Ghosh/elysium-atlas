import { useCallback, useEffect, useRef } from "react";

export function useKbListPolling(
  fetchFn: (isPolling: boolean) => Promise<boolean>,
  deps: unknown[] = [],
) {
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPollingIfNeeded = useCallback(
    (hasIndexing: boolean) => {
      if (hasIndexing && !pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchFnRef.current(true);
        }, 5000);
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    stopPolling();
    const hasIndexing = await fetchFnRef.current(false);
    startPollingIfNeeded(hasIndexing);
  }, [startPollingIfNeeded, stopPolling]);

  useEffect(() => {
    refresh();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { refresh, stopPolling, startPollingIfNeeded };
}
