import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import aiSocket from "@/lib/aiSocket";
import { useAppDispatch, useAppSelector, store } from "@/store";
import {
  setTeamMemberConversationLogs,
  addOrUpdateConversationLog,
  updateConversationLogLastMessage,
  type TeamMemberConversationLog,
} from "@/store/reducers/agentSlice";
import fastApiAxios from "@/utils/fastapi_axios";

interface ApiResponseItem {
  chat_session_id: string;
  alias_name: string | null;
  last_message_at: string | null;
  visitor_online: boolean;
  last_connected_at: string;
  geo_data: TeamMemberConversationLog["geo_data"];
  last_message: {
    message_id: string;
    _id?: string;
    role: string;
    content: string;
    created_at: string;
  } | null;
  has_unread_messages?: boolean;
  unread_visitor_message_count?: number;
}

export type AgentVisitorAiChatMessagePayload = ApiResponseItem & {
  agent_id: string;
  conversation_mode?: "ai" | "human";
};

export function mapApiItemToConversationLog(
  item: ApiResponseItem,
  agentId: string,
): TeamMemberConversationLog {
  const hasUnread = item.has_unread_messages === true;
  const unreadCount =
    typeof item.unread_visitor_message_count === "number"
      ? item.unread_visitor_message_count
      : 0;

  return {
    chat_session_id: item.chat_session_id,
    alias_name: item.alias_name,
    agent_id: agentId,
    last_message: item.last_message?.content ?? null,
    last_message_at: item.last_message_at,
    captured_at: item.last_connected_at,
    ended_at: null,
    status: item.visitor_online ? "live" : "ended",
    unread_count: unreadCount,
    is_unread: hasUnread,
    color: "",
    geo_data: item.geo_data ?? null,
  };
}

type FetchOptions = {
  replace?: boolean;
  silent?: boolean;
};

export function useTeamMemberChatSessions() {
  const dispatch = useAppDispatch();
  const agentID = useAppSelector((state) => state.agent.agentID);
  const triggerFetch = useAppSelector(
    (state) => state.agent.triggerFetchTeamMemberChatSessions,
  );

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const fetchSessions = useCallback(
    async (pageNum: number, options?: FetchOptions) => {
      if (!agentID) return;

      const token = Cookies.get("elysium_atlas_session_token");
      if (!options?.silent) setLoading(true);

      try {
        const res = await fastApiAxios.post(
          "/elysium-agents/atlas-team-members/team-member-chat-sessions",
          { agent_id: agentID, page: pageNum, limit: 20 },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const { data, has_next } = res.data as {
          data: ApiResponseItem[];
          has_next: boolean;
        };

        const logs = data.map((item) => mapApiItemToConversationLog(item, agentID));

        if (pageNum === 1 && options?.replace) {
          dispatch(setTeamMemberConversationLogs(logs));
        } else {
          logs.forEach((log) => {
            dispatch(addOrUpdateConversationLog(log));
          });
        }

        setHasNext(has_next);
        setPage(pageNum);
      } catch {
        // silently ignore fetch errors
      } finally {
        if (!options?.silent) setLoading(false);
        if (pageNum === 1) setInitialLoaded(true);
      }
    },
    [agentID, dispatch],
  );

  useEffect(() => {
    if (!agentID || triggerFetch === 0) return;
    fetchSessions(1, { replace: true });
  }, [agentID, triggerFetch, fetchSessions]);

  useEffect(() => {
    if (!agentID) return;

    const handleAgentVisitorAiChatMessage = (
      row: AgentVisitorAiChatMessagePayload,
    ) => {
      if (row.agent_id !== agentID || !row.chat_session_id) return;

      const exists = store
        .getState()
        .agent.team_member_conversation_logs.some(
          (l) => l.chat_session_id === row.chat_session_id,
        );
      if (!exists) return;

      const mapped = mapApiItemToConversationLog(row, agentID);
      dispatch(addOrUpdateConversationLog(mapped));
      dispatch(
        updateConversationLogLastMessage({
          chat_session_id: row.chat_session_id,
          last_message: mapped.last_message,
          last_message_at: mapped.last_message_at,
        }),
      );
    };

    aiSocket.on("agent_visitor_ai_chat_message", handleAgentVisitorAiChatMessage);
    return () => {
      aiSocket.off(
        "agent_visitor_ai_chat_message",
        handleAgentVisitorAiChatMessage,
      );
    };
  }, [agentID, dispatch]);

  return {
    fetchSessions,
    page,
    hasNext,
    loading,
    initialLoaded,
  };
}
