"use client";

import { memo, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector, store } from "@/store";
import {
  removeCapturedSession,
  expandCapturedSession,
  collapseCapturedSession,
  setConversationChainForSession,
  addMessageToCapturedSession,
  updateConversationLogLastMessage,
  incrementConversationLogUnread,
} from "@/store/reducers/agentSlice";
import fastApiAxios from "@/utils/fastapi_axios";
import { normalizeConversationMessage } from "@/utils/conversationMessageUtils";
import aiSocket from "@/lib/aiSocket";
import { emitStopMonitorConversation } from "@/utils/chatMonitorUtils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ConversationChatHeader, {
  type CapturedSession,
} from "@/components/ElysiumAtlas/ConversationChatHeader";
import ConversationChatBody from "@/components/ElysiumAtlas/ConversationChatBody";
import ConversationMonitorBanner from "@/components/ElysiumAtlas/ConversationMonitorBanner";
import { useCapturedSessionTakeover } from "@/hooks/useCapturedSessionTakeover";
import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";
import { canResolveChatSession } from "@/utils/teamPermissions";

const MAX_VISIBLE = 2;

// ─── Single chat box ──────────────────────────────────────────────────────────

const ChatBox = memo(function ChatBox({
  session,
  isExpanded,
  onToggle,
  onClose,
  agentID,
}: {
  session: CapturedSession;
  isExpanded: boolean;
  onToggle: (chatSessionId: string, currentlyExpanded: boolean) => void;
  onClose: (chatSessionId: string) => void;
  agentID: string;
}) {
  const [isDesktop, setIsDesktop] = useState(false);
  // Always start collapsed so the CSS transition fires on first mount too
  const [visuallyExpanded, setVisuallyExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const dispatch = useAppDispatch();
  const userID = useAppSelector((state) => state.userProfile.userID);
  const teamRole = useActiveTeamRole();
  const liveSession = useAppSelector((state) =>
    state.agent.captured_sessions.find(
      (s) => s.chat_session_id === session.chat_session_id,
    ),
  );
  const conversationMode =
    liveSession?.conversation_mode ?? session.conversation_mode;
  const inConversationWith = useAppSelector((state) => {
    const visitor = state.agent.active_visitors.find(
      (v) => v.chat_session_id === session.chat_session_id,
    );
    return visitor?.in_conversation_with ?? session.in_conversation_with;
  });
  const handlerName = useAppSelector((state) => {
    const visitor = state.agent.active_visitors.find(
      (v) => v.chat_session_id === session.chat_session_id,
    );
    return (
      visitor?.in_conversation_with_name ?? session.in_conversation_with_name
    );
  });

  const isPeerTakeover = Boolean(
    inConversationWith && inConversationWith !== userID,
  );
  const canTakeOver = !isPeerTakeover;
  const pauseAgentMirror = isPeerTakeover && conversationMode === "monitor";

  const handleClose = useCallback(() => {
    // Collapse first, then remove after transition
    setIsClosing(true);
    setVisuallyExpanded(false);
    setTimeout(() => onClose(session.chat_session_id), 310);
  }, [onClose, session.chat_session_id]);

  const handleToggle = useCallback(() => {
    if (isClosing) return;
    onToggle(session.chat_session_id, isExpanded);
  }, [isClosing, onToggle, session.chat_session_id, isExpanded]);

  const canManageTakeover = conversationMode === "takeover" && !isPeerTakeover;
  const canMarkResolved = canResolveChatSession(teamRole, {
    conversation_mode: conversationMode,
    in_conversation_with: inConversationWith,
    user_id: userID,
  });

  const {
    requestTakeover,
    requestRelease,
    requestResolve,
    isTakeoverPending,
    isReleasePending,
    isResolvePending,
  } = useCapturedSessionTakeover({
    agent_id: agentID,
    chat_session_id: session.chat_session_id,
    conversation_mode: conversationMode,
    user_id: userID,
    team_role: teamRole,
    onReleased: handleClose,
    onResolved: handleClose,
  });

  const showMonitorBanner =
    visuallyExpanded && conversationMode === "monitor" && !isClosing;

  const headerSession = useMemo(
    () => ({ ...session, conversation_mode: conversationMode }),
    [session, conversationMode],
  );

  const chatPanelBody = (
    <div
      className={
        visuallyExpanded
          ? "flex flex-col flex-1 min-h-0 overflow-hidden"
          : "hidden"
      }
    >
      <ConversationChatBody
        chat_session_id={session.chat_session_id}
        agent_id={agentID}
        conversationMode={conversationMode}
        isVisible={visuallyExpanded}
        pauseAgentMirror={pauseAgentMirror}
      />
    </div>
  );

  const headerWithBanner = (
    <>
      <ConversationChatHeader
        session={headerSession}
        isExpanded={visuallyExpanded}
        onToggle={handleToggle}
        onClose={handleClose}
        onRelease={requestRelease}
        onResolve={requestResolve}
        canRelease={canManageTakeover}
        canMarkResolved={canMarkResolved}
        isReleasePending={isReleasePending}
        isResolvePending={isResolvePending}
      />
      {showMonitorBanner && (
        <ConversationMonitorBanner
          variant={isPeerTakeover ? "peer" : "self"}
          handlerName={handlerName}
          onTakeOver={requestTakeover}
          isTakeoverPending={isTakeoverPending}
          canTakeOver={canTakeOver}
        />
      )}
    </>
  );

  // Fetch conversation history when the panel expands (not on every capture).
  useEffect(() => {
    if (!visuallyExpanded) return;

    let cancelled = false;
    const fetchMessages = async () => {
      try {
        const response = await fastApiAxios.post(
          "/elysium-agents/elysium-atlas/agent/v1/get-agent-fields",
          {
            agent_id: agentID,
            fields: ["agent_name"],
            chat_session_id: session.chat_session_id,
          },
        );
        const data = response.data;
        if (cancelled) return;
        if (data.success === true) {
          const rawMessages = data.chat_session_data?.messages ?? [];
          const messages = Array.isArray(rawMessages)
            ? rawMessages.map((m: Record<string, unknown>) =>
                normalizeConversationMessage(m),
              )
            : [];
          dispatch(
            setConversationChainForSession({
              chat_session_id: session.chat_session_id,
              conversation_chain: messages,
            }),
          );
        }
      } catch (e) {
        // fail silently- existing empty chain stays
      }
    };
    fetchMessages();
    return () => {
      cancelled = true;
    };
  }, [visuallyExpanded, agentID, session.chat_session_id, dispatch]);

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

  // ── Desktop: inline animated box, no Dialog ──
  if (isDesktop) {
    return (
      <div
        className={`pointer-events-auto bg-white dark:bg-deep-onyx border border-gray-100 dark:border-deep-onyx rounded-t-xl shadow-xl flex flex-col overflow-hidden transition-[height,width] duration-300 ease-in-out ${
          visuallyExpanded
            ? "w-[540px] h-[580px] xl:w-[600px] xl:h-[660px]"
            : "w-72 h-16"
        }`}
      >
        {headerWithBanner}
        {visuallyExpanded ? chatPanelBody : null}
      </div>
    );
  }

  // ── Mobile / tablet: Dialog for expanded, nothing for collapsed ──
  return (
    <>
      <Dialog
        open={isExpanded && !isClosing}
        onOpenChange={(open) => {
          if (!open) handleToggle();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="p-0 gap-0 flex flex-col overflow-hidden w-screen max-w-none! h-dvh top-0! left-0! right-0! translate-x-0! translate-y-0! rounded-none border-0"
          onPointerDownOutside={(event) => {
            const target = event.target;
            if (
              target instanceof Element &&
              target.closest('[data-slot="dropdown-menu-content"]')
            ) {
              event.preventDefault();
            }
          }}
        >
          <DialogTitle className="sr-only">
            Chat with {session.chat_session_id}
          </DialogTitle>
          <div className="flex flex-col shrink-0">
            <ConversationChatHeader
              session={headerSession}
              isExpanded={true}
              onToggle={handleToggle}
              onClose={handleClose}
              onRelease={requestRelease}
              onResolve={requestResolve}
              canRelease={canManageTakeover}
              canMarkResolved={canMarkResolved}
              isReleasePending={isReleasePending}
              isResolvePending={isResolvePending}
            />
            {conversationMode === "monitor" && (
              <ConversationMonitorBanner
                variant={isPeerTakeover ? "peer" : "self"}
                handlerName={handlerName}
                onTakeOver={requestTakeover}
                isTakeoverPending={isTakeoverPending}
                canTakeOver={canTakeOver}
              />
            )}
          </div>
          <ConversationChatBody
            chat_session_id={session.chat_session_id}
            agent_id={agentID}
            conversationMode={conversationMode}
            isVisible
            pauseAgentMirror={pauseAgentMirror}
          />
        </DialogContent>
      </Dialog>

      {/* Collapsed bar hidden on mobile/tablet */}
      {!isExpanded && <></>}
    </>
  );
});

// ─── Panel ────────────────────────────────────────────────────────────────────

/** When `inline` is true the component renders chat boxes only,
 *  without its own fixed wrapper- the parent owns the positioning. */
export default function TeamMemberConversationsPanel({
  inline = false,
}: {
  inline?: boolean;
}) {
  const dispatch = useAppDispatch();
  const capturedSessions = useAppSelector(
    (state) => state.agent.captured_sessions,
  );
  const agentID = useAppSelector((state) => state.agent.agentID);
  const capturedSessionsRef = useRef(capturedSessions);
  capturedSessionsRef.current = capturedSessions;

  const displayed = useMemo<CapturedSession[]>(
    () =>
      [...capturedSessions]
        .sort(
          (a, b) =>
            new Date(a.captured_at).getTime() -
            new Date(b.captured_at).getTime(),
        )
        .slice(-MAX_VISIBLE),
    [capturedSessions],
  );

  const toggleExpand = useCallback(
    (id: string, currentlyExpanded: boolean) => {
      if (currentlyExpanded) {
        dispatch(collapseCapturedSession(id));
      } else {
        dispatch(expandCapturedSession(id));
      }
    },
    [dispatch],
  );

  const handleClose = useCallback(
    (id: string) => {
      const session = capturedSessionsRef.current.find(
        (s) => s.chat_session_id === id,
      );
      if (session?.conversation_mode === "monitor") {
        emitStopMonitorConversation(agentID, id);
      }
      dispatch(removeCapturedSession(id));
    },
    [agentID, dispatch],
  );

  // Collapsed chat bodies unmount to save work. Keep Redux in sync for unread
  // badges and message history when sessions are collapsed.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessageFromVisitor = (data: {
      agent_id: string;
      chat_session_id: string;
      message: string;
      sender: string;
      message_id?: string;
      _id?: string;
      created_at?: string;
    }) => {
      const session = capturedSessionsRef.current.find(
        (s) => s.chat_session_id === data.chat_session_id,
      );
      if (!session || session.is_expanded) return;

      const visitorMsgAt = data.created_at ?? new Date().toISOString();

      dispatch(
        addMessageToCapturedSession({
          chat_session_id: data.chat_session_id,
          message: {
            message_id:
              data.message_id ??
              data._id ??
              `${data.chat_session_id}-${visitorMsgAt}`,
            _id: data._id,
            role: "user",
            content: data.message,
            created_at: visitorMsgAt,
          },
        }),
      );

      dispatch(
        updateConversationLogLastMessage({
          chat_session_id: data.chat_session_id,
          last_message: data.message,
          last_message_at: visitorMsgAt,
        }),
      );

      dispatch(incrementConversationLogUnread(data.chat_session_id));
    };

    const handleMessageFromAgent = (data: {
      agent_id: string;
      chat_session_id: string;
      message?: string;
      content?: string;
      sender: string;
      message_id?: string;
      _id?: string;
      role?: string;
      created_at?: string;
    }) => {
      const session = capturedSessionsRef.current.find(
        (s) => s.chat_session_id === data.chat_session_id,
      );
      if (!session || session.is_expanded) return;

      if (session.conversation_mode === "monitor") {
        const visitor = store
          .getState()
          .agent.active_visitors.find(
            (v) => v.chat_session_id === data.chat_session_id,
          );
        const handlerId = visitor?.in_conversation_with;
        const userID = store.getState().userProfile.userID;
        if (handlerId && handlerId !== userID) return;
      }

      const agentMsgAt = data.created_at ?? new Date().toISOString();
      const content = data.content ?? data.message ?? "";

      dispatch(
        addMessageToCapturedSession({
          chat_session_id: data.chat_session_id,
          message: {
            message_id:
              data.message_id ??
              data._id ??
              `${data.chat_session_id}-${agentMsgAt}`,
            _id: data._id,
            role: (data.role as "user" | "agent" | "human") ?? "agent",
            content,
            created_at: agentMsgAt,
          },
        }),
      );

      dispatch(
        updateConversationLogLastMessage({
          chat_session_id: data.chat_session_id,
          last_message: content,
          last_message_at: agentMsgAt,
        }),
      );
    };

    const handleMessageFromTeamMember = (data: {
      agent_id: string;
      chat_session_id: string;
      message: string;
      sender: string;
      message_id?: string;
      _id?: string;
      role?: string;
      created_at?: string;
    }) => {
      const session = capturedSessionsRef.current.find(
        (s) => s.chat_session_id === data.chat_session_id,
      );
      if (
        !session ||
        session.is_expanded ||
        session.conversation_mode !== "monitor"
      ) {
        return;
      }

      const teamMsgAt = data.created_at ?? new Date().toISOString();
      const content = data.message ?? "";

      dispatch(
        addMessageToCapturedSession({
          chat_session_id: data.chat_session_id,
          message: {
            message_id:
              data.message_id ??
              data._id ??
              `${data.chat_session_id}-${teamMsgAt}`,
            _id: data._id,
            role: (data.role as "user" | "agent" | "human") ?? "human",
            content,
            created_at: teamMsgAt,
          },
        }),
      );

      dispatch(
        updateConversationLogLastMessage({
          chat_session_id: data.chat_session_id,
          last_message: content,
          last_message_at: teamMsgAt,
          from_agent: true,
        }),
      );
    };

    aiSocket.on("message_from_visitor", handleMessageFromVisitor);
    aiSocket.on("message_from_agent", handleMessageFromAgent);
    aiSocket.on("message_from_team_member", handleMessageFromTeamMember);
    return () => {
      aiSocket.off("message_from_visitor", handleMessageFromVisitor);
      aiSocket.off("message_from_agent", handleMessageFromAgent);
      aiSocket.off("message_from_team_member", handleMessageFromTeamMember);
    };
  }, [dispatch]);

  const boxes = useMemo(
    () =>
      displayed.map((session) => (
        <ChatBox
          key={session.chat_session_id}
          session={session}
          isExpanded={session.is_expanded}
          agentID={agentID}
          onToggle={toggleExpand}
          onClose={handleClose}
        />
      )),
    [displayed, agentID, toggleExpand, handleClose],
  );

  if (inline) {
    // Render boxes as a fragment- parent owns the layout
    return <>{boxes}</>;
  }

  if (displayed.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-6 flex flex-row-reverse items-end gap-3 z-50 pointer-events-none">
      {boxes}
    </div>
  );
}
