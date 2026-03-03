"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  removeCapturedSession,
  expandCapturedSession,
  collapseCapturedSession,
} from "@/store/reducers/agentSlice";
import aiSocket from "@/lib/aiSocket";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ConversationChatHeader, {
  type CapturedSession,
} from "@/components/ElysiumAtlas/ConversationChatHeader";
import ConversationChatBody from "@/components/ElysiumAtlas/ConversationChatBody";

const MAX_VISIBLE = 3;

// ─── Single chat box ──────────────────────────────────────────────────────────

function ChatBox({
  session,
  isExpanded,
  onToggle,
  onClose,
  agentID,
}: {
  session: CapturedSession;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
  agentID: string;
}) {
  const [isDesktop, setIsDesktop] = useState(false);
  // Always start collapsed so the CSS transition fires on first mount too
  const [visuallyExpanded, setVisuallyExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Sync visuallyExpanded with isExpanded, but one RAF later so the
  // browser paints the collapsed state first → transition always animates
  useEffect(() => {
    if (isClosing) return;
    const raf = requestAnimationFrame(() => setVisuallyExpanded(isExpanded));
    return () => cancelAnimationFrame(raf);
  }, [isExpanded, isClosing]);

  const handleClose = () => {
    // Collapse first, then remove after transition
    setIsClosing(true);
    setVisuallyExpanded(false);
    setTimeout(() => onClose(), 310);
  };

  // ── Desktop: inline animated box, no Dialog ──
  if (isDesktop) {
    return (
      <div
        className={`pointer-events-auto bg-white dark:bg-deep-onyx border border-gray-100 dark:border-deep-onyx rounded-t-xl shadow-xl flex flex-col overflow-hidden transition-[height,width] duration-300 ease-in-out ${
          visuallyExpanded ? "w-[480px] h-[580px]" : "w-72 h-12"
        }`}
      >
        <ConversationChatHeader
          session={session}
          isExpanded={visuallyExpanded}
          onToggle={isClosing ? () => {} : onToggle}
          onClose={handleClose}
        />
        {visuallyExpanded && (
          <ConversationChatBody
            chat_session_id={session.chat_session_id}
            agent_id={agentID}
          />
        )}
      </div>
    );
  }

  // ── Mobile / tablet: Dialog for expanded, nothing for collapsed ──
  return (
    <>
      <Dialog
        open={isExpanded && !isClosing}
        onOpenChange={(open) => {
          if (!open) onToggle();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="p-0 gap-0 flex flex-col overflow-hidden w-screen max-w-none! h-dvh top-0! left-0! right-0! translate-x-0! translate-y-0! rounded-none border-0"
        >
          <DialogTitle className="sr-only">
            Chat with {session.chat_session_id}
          </DialogTitle>
          <ConversationChatHeader
            session={session}
            isExpanded={true}
            onToggle={onToggle}
            onClose={handleClose}
          />
          <ConversationChatBody
            chat_session_id={session.chat_session_id}
            agent_id={agentID}
          />
        </DialogContent>
      </Dialog>

      {/* Collapsed bar hidden on mobile/tablet */}
      {!isExpanded && <></>}
    </>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function TeamMemberConversationsPanel() {
  const dispatch = useAppDispatch();
  const capturedSessions = useAppSelector(
    (state) => state.agent.captured_sessions,
  );
  const agentID = useAppSelector((state) => state.agent.agentID);

  const displayed: CapturedSession[] = [...capturedSessions]
    .sort(
      (a, b) =>
        new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime(),
    )
    .slice(-MAX_VISIBLE);

  const toggleExpand = (id: string, currentlyExpanded: boolean) => {
    if (currentlyExpanded) {
      dispatch(collapseCapturedSession(id));
    } else {
      dispatch(expandCapturedSession(id));
    }
  };

  const handleClose = (id: string) => {
    aiSocket.emit("atlas-team-member-end-conversation", {
      agent_id: agentID,
      chat_session_id: id,
    });
    dispatch(removeCapturedSession(id));
  };

  if (displayed.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-6 flex flex-row-reverse items-end gap-3 z-50 pointer-events-none">
      {displayed.map((session) => (
        <ChatBox
          key={session.chat_session_id}
          session={session}
          isExpanded={session.is_expanded}
          agentID={agentID}
          onToggle={() =>
            toggleExpand(session.chat_session_id, session.is_expanded)
          }
          onClose={() => handleClose(session.chat_session_id)}
        />
      ))}
    </div>
  );
}
