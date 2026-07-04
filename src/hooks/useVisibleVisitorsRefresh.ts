import { useCallback, useEffect, useRef } from "react";
import aiSocket from "@/lib/aiSocket";
import { useAppDispatch, useAppSelector, store } from "@/store";
import { mergeRefreshedActiveVisitors } from "@/store/reducers/agentSlice";
import { pickChangedRefreshRows } from "@/utils/chatSessionListUtils";
import type { ChatSessionListRow } from "@/utils/chatSessionListUtils";
import { useVisibilityAwareInterval } from "@/hooks/useVisibilityAwareInterval";

const REFRESH_INTERVAL_MS = 10_000;
const MAX_SESSION_IDS = 100;

type SessionsRefreshedPayload = {
  success: boolean;
  message?: string | null;
  agent_id: string;
  visitors?: ChatSessionListRow[];
};

type UseVisibleVisitorsRefreshOptions = {
  agentId: string | null;
  /** Changes when a full list/search fetch completes — restarts the 10s timer. */
  listSnapshotKey: string;
  enabled?: boolean;
};

export function useVisibleVisitorsRefresh({
  agentId,
  listSnapshotKey,
  enabled = true,
}: UseVisibleVisitorsRefreshOptions) {
  const dispatch = useAppDispatch();
  const hasVisibleRows = useAppSelector(
    (state) => state.agent.active_visitors.length > 0,
  );

  const agentIdRef = useRef(agentId);
  agentIdRef.current = agentId;

  const refreshVisibleRows = useCallback(() => {
    const currentAgentId = agentIdRef.current;
    if (!currentAgentId || document.visibilityState !== "visible") return;

    const chat_session_ids = store
      .getState()
      .agent.active_visitors.map((row) => row.chat_session_id)
      .filter(Boolean)
      .slice(0, MAX_SESSION_IDS);

    if (!chat_session_ids.length) return;

    aiSocket.emit("atlas-agent-visitors-refresh-sessions", {
      agent_id: currentAgentId,
      chat_session_ids,
    });
  }, []);

  const isActive = Boolean(agentId) && enabled && hasVisibleRows;

  // First refresh fires after REFRESH_INTERVAL_MS — not on mount or after a full list fetch.
  // listSnapshotKey restarts the timer whenever atlas-agent-visitors-list/search returns.
  useVisibilityAwareInterval(refreshVisibleRows, {
    enabled: isActive,
    intervalMs: REFRESH_INTERVAL_MS,
    runOnVisible: false,
    runOnStart: false,
    resetKey: listSnapshotKey,
  });

  useEffect(() => {
    if (!agentId || !enabled) return;

    const handleSessionsRefreshed = (data: SessionsRefreshedPayload) => {
      const currentAgentId = agentIdRef.current;
      if (!currentAgentId || data.agent_id !== currentAgentId || !data.success) {
        return;
      }

      const activeVisitors = store.getState().agent.active_visitors;
      const visibleIds = new Set(activeVisitors.map((v) => v.chat_session_id));
      const incoming = (data.visitors ?? []).filter((row) =>
        visibleIds.has(row.chat_session_id),
      );
      const changedRows = pickChangedRefreshRows(activeVisitors, incoming);

      if (changedRows.length) {
        dispatch(mergeRefreshedActiveVisitors(changedRows));
      }
    };

    aiSocket.on("agent_visitors_sessions_refreshed", handleSessionsRefreshed);

    return () => {
      aiSocket.off("agent_visitors_sessions_refreshed", handleSessionsRefreshed);
    };
  }, [agentId, enabled, dispatch]);
}
