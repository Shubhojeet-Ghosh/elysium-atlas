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

type CapturedSession = {
  chat_session_id: string;
  captured_at: string;
  is_expanded: boolean;
};

const MAX_VISIBLE = 3;

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "" : "rotate-180"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 6L6 18M6 6l12 12"
      />
    </svg>
  );
}

// ─── Shared header bar ────────────────────────────────────────────────────────

function ChatHeader({
  session,
  isExpanded,
  onToggle,
  onClose,
}: {
  session: CapturedSession;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 h-12 shrink-0 cursor-pointer select-none hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20 transition-colors border-b border-gray-100 dark:border-deep-onyx"
      onClick={onToggle}
    >
      <div className="shrink-0 w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <rect width="40" height="40" fill="#e5e7eb" />
          <circle cx="20" cy="16" r="7" fill="#9ca3af" />
          <ellipse cx="20" cy="34" rx="12" ry="8" fill="#9ca3af" />
        </svg>
      </div>

      <span className="flex-1 text-sm font-semibold truncate text-gray-800 dark:text-gray-100">
        {session.chat_session_id.length > 18
          ? `${session.chat_session_id.slice(0, 18)}…`
          : session.chat_session_id}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="p-1 rounded-full cursor-pointer text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label={isExpanded ? "Minimise chat" : "Expand chat"}
      >
        <ChevronIcon isExpanded={isExpanded} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="p-1 rounded-full cursor-pointer text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Close chat"
      >
        <XIcon />
      </button>
    </div>
  );
}

// ─── Chat body ────────────────────────────────────────────────────────────────

function ChatBody() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <span className="text-sm text-gray-400 dark:text-gray-500 text-center">
          Connecting to visitor…
        </span>
      </div>
      <div className="px-3 py-2 border-t border-gray-100 dark:border-deep-onyx shrink-0">
        <input
          type="text"
          placeholder="Type a message…"
          className="w-full text-sm bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-serene-purple/40 text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}

// ─── Single chat box ──────────────────────────────────────────────────────────

function ChatBox({
  session,
  isExpanded,
  onToggle,
  onClose,
}: {
  session: CapturedSession;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const [isDesktop, setIsDesktop] = useState(false);
  // Always start collapsed so the CSS transition fires on first mount too
  const [visuallyExpanded, setVisuallyExpanded] = useState(false);

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
    const raf = requestAnimationFrame(() => setVisuallyExpanded(isExpanded));
    return () => cancelAnimationFrame(raf);
  }, [isExpanded]);

  // ── Desktop: inline animated box, no Dialog ──
  if (isDesktop) {
    return (
      <div
        className={`pointer-events-auto bg-white dark:bg-deep-onyx border border-gray-100 dark:border-deep-onyx rounded-t-xl shadow-xl flex flex-col overflow-hidden transition-[height,width] duration-300 ease-in-out ${
          visuallyExpanded ? "w-[480px] h-[580px]" : "w-72 h-12"
        }`}
      >
        <ChatHeader
          session={session}
          isExpanded={visuallyExpanded}
          onToggle={onToggle}
          onClose={onClose}
        />
        {visuallyExpanded && <ChatBody />}
      </div>
    );
  }

  // ── Mobile / tablet: Dialog for expanded, nothing for collapsed ──
  return (
    <>
      <Dialog
        open={isExpanded}
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
          <ChatHeader
            session={session}
            isExpanded={true}
            onToggle={onToggle}
            onClose={onClose}
          />
          <ChatBody />
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
          onToggle={() =>
            toggleExpand(session.chat_session_id, session.is_expanded)
          }
          onClose={() => handleClose(session.chat_session_id)}
        />
      ))}
    </div>
  );
}
