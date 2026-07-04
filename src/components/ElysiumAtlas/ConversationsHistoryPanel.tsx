"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAppSelector } from "@/store";
import { useTeamMemberChatSessions } from "@/hooks/useTeamMemberChatSessions";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ConversationsHistoryHeader from "./ConversationsHistory/ConversationsHistoryHeader";
import ConversationsHistoryBody from "./ConversationsHistory/ConversationsHistoryBody";
import {
  countDisplayUnreadForLogs,
  hasDisplayUnreadForLogs,
} from "@/utils/conversationLogUnreadUtils";

const PANEL_TRANSITION_MS = 300;

const panelShellClassName =
  "pointer-events-auto bg-white dark:bg-deep-onyx border border-serene-purple dark:border-pure-mist rounded-t-xl shadow-2xl flex flex-col overflow-hidden transition-[height,width] duration-300 ease-in-out";

export default function ConversationsHistoryPanel({
  onExpandedChange,
}: {
  onExpandedChange?: (expanded: boolean) => void;
}) {
  const agentID = useAppSelector((state) => state.agent.agentID);
  const conversationLogs = useAppSelector(
    (state) => state.agent.team_member_conversation_logs,
  );
  const capturedSessions = useAppSelector(
    (state) => state.agent.captured_sessions,
  );
  const { fetchSessions, page, hasNext, loading, initialLoaded } =
    useTeamMemberChatSessions();
  const [isExpanded, setIsExpanded] = useState(false);
  const [visuallyExpanded, setVisuallyExpanded] = useState(false);
  const [renderBody, setRenderBody] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  useEffect(() => {
    if (!isExpanded || !agentID) return;
    fetchSessions(1, { replace: true });
  }, [isExpanded, agentID, fetchSessions]);

  // Desktop only: paint collapsed first, then animate open; keep body through close.
  useEffect(() => {
    if (!isDesktop) {
      setVisuallyExpanded(isExpanded);
      setRenderBody(isExpanded);
      return;
    }

    if (isExpanded) {
      setRenderBody(true);
      setVisuallyExpanded(false);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisuallyExpanded(true));
      });
      return () => cancelAnimationFrame(raf);
    }

    setVisuallyExpanded(false);
    const timeout = window.setTimeout(
      () => setRenderBody(false),
      PANEL_TRANSITION_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [isExpanded, isDesktop]);

  const totalUnread = useMemo(
    () => countDisplayUnreadForLogs(conversationLogs, capturedSessions),
    [conversationLogs, capturedSessions],
  );

  const hasCollapsedUnread = useMemo(
    () => hasDisplayUnreadForLogs(conversationLogs, capturedSessions),
    [conversationLogs, capturedSessions],
  );

  const handleToggle = useCallback(() => {
    setIsExpanded((v) => !v);
  }, []);

  const header = (
    <ConversationsHistoryHeader
      isExpanded={isExpanded}
      totalUnread={totalUnread}
      hasCollapsedUnread={hasCollapsedUnread}
      onToggle={handleToggle}
    />
  );

  const body = (
    <ConversationsHistoryBody
      fetchSessions={fetchSessions}
      page={page}
      hasNext={hasNext}
      loading={loading}
      initialLoaded={initialLoaded}
    />
  );

  if (isDesktop) {
    return (
      <div
        className={`${panelShellClassName} ${
          visuallyExpanded
            ? "w-80 lg:w-[28rem] h-[580px] xl:h-[660px]"
            : "w-64 lg:w-80 h-14"
        }`}
      >
        {header}
        {renderBody && (
          <div
            className={`flex flex-col flex-1 min-h-0 overflow-hidden transition-opacity duration-300 ease-in-out ${
              visuallyExpanded ? "opacity-100" : "opacity-0"
            }`}
          >
            {body}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Dialog
        open={isExpanded}
        onOpenChange={(open) => {
          if (!open) setIsExpanded(false);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="p-0 gap-0 flex flex-col overflow-hidden w-screen max-w-none! h-dvh top-0! left-0! right-0! translate-x-0! translate-y-0! rounded-none border-0"
        >
          <DialogTitle className="sr-only">Messaging</DialogTitle>
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {header}
            {body}
          </div>
        </DialogContent>
      </Dialog>

      {!isExpanded && (
        <div className={`${panelShellClassName} w-64 h-14`}>{header}</div>
      )}
    </>
  );
}
