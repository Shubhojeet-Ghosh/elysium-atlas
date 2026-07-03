import { useEffect, useRef } from "react";

/**
 * Loads attached KB list data once when the tab mounts or agentId changes.
 * Refetches only when a refresh trigger counter increases (e.g. after save),
 * not on mount when triggers are already non-zero from a prior action.
 */
export function useAgentAttachedListLoad(
  agentId: string | undefined,
  refreshTriggers: number[],
  onLoad: () => void | Promise<void>,
  onCleanup?: () => void,
) {
  const onLoadRef = useRef(onLoad);
  const onCleanupRef = useRef(onCleanup);
  const triggersRef = useRef<number[] | null>(null);
  const agentRef = useRef(agentId);

  onLoadRef.current = onLoad;
  onCleanupRef.current = onCleanup;

  useEffect(() => {
    if (!agentId) return;

    const agentChanged = agentRef.current !== agentId;
    agentRef.current = agentId;

    const runLoad = () => {
      void onLoadRef.current();
    };

    if (agentChanged || triggersRef.current === null) {
      triggersRef.current = [...refreshTriggers];
      runLoad();
      return () => onCleanupRef.current?.();
    }

    const prev = triggersRef.current;
    const bumped = refreshTriggers.some(
      (value, index) => value !== (prev[index] ?? 0),
    );
    triggersRef.current = [...refreshTriggers];

    if (bumped && refreshTriggers.some((value) => value !== 0)) {
      runLoad();
    }

    return () => onCleanupRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, ...refreshTriggers]);
}
