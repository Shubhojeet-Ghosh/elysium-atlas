import { useEffect, useRef } from "react";

type UseVisibilityAwareIntervalOptions = {
  enabled?: boolean;
  intervalMs: number;
  /** Run once when the tab becomes visible again. Default true. */
  runOnVisible?: boolean;
  /** Run once when the interval starts (tab visible + enabled). Default false. */
  runOnStart?: boolean;
  /** When this value changes, the interval is cleared and restarted (no immediate tick). */
  resetKey?: string | number;
};

/**
 * Runs `callback` on a fixed interval only while the document tab is visible.
 * The interval is cleared when the tab is hidden or the effect unmounts.
 */
export function useVisibilityAwareInterval(
  callback: () => void,
  {
    enabled = true,
    intervalMs,
    runOnVisible = true,
    runOnStart = false,
    resetKey,
  }: UseVisibilityAwareIntervalOptions,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      callbackRef.current();
    };

    const stopInterval = () => {
      if (intervalId == null) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    const startInterval = () => {
      stopInterval();
      intervalId = setInterval(tick, intervalMs);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (runOnVisible) tick();
        startInterval();
        return;
      }
      stopInterval();
    };

    if (document.visibilityState === "visible") {
      if (runOnStart) tick();
      startInterval();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, intervalMs, runOnVisible, runOnStart, resetKey]);
}

/**
 * Debounces a callback; clears any pending timeout on unmount or re-run.
 */
export function useDebouncedEffect(
  callback: () => void,
  deps: readonly unknown[],
  delayMs: number,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      callbackRef.current();
    }, delayMs);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Tracks whether the component is mounted; flips false on unmount.
 */
export function useIsMountedRef() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}
