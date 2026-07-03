import type {
  ActiveVisitor,
  GeoData,
  CapturedSessionMode,
} from "@/store/reducers/agentSlice";
import type { AppDispatch } from "@/store";
import { addCapturedSession } from "@/store/reducers/agentSlice";
import { emitStartMonitorConversation } from "@/utils/chatMonitorUtils";
import { emitStartTakeoverConversation } from "@/utils/chatTakeoverUtils";
import { toast } from "sonner";
import type { TeamRole } from "@/types/auth";
import {
  canMonitorDuringActiveTakeover,
  isPeerTakeoverMonitorBlocked,
} from "@/utils/teamPermissions";

/** Raw row shape from `agent_visitors_list`. */
export type ChatSessionListRow = {
  agent_id: string;
  chat_session_id: string;
  created_at?: string;
  last_message_at: string | null;
  last_connected_at?: string | null;
  sid?: string | null;
  alias_name: string | null;
  in_conversation_with?: string | null;
  in_conversation_with_name?: string | null;
  geo_data: GeoData | null;
  visitor_at: string | null;
  visitor_online?: boolean;
  color?: string;
  newly_joined?: boolean;
  status?: string;
};

export type VisitorDisplayStatus =
  | "online"
  | "offline"
  | "in-conversation";

export function deriveVisitorDisplayStatus(
  row: Pick<ChatSessionListRow, "visitor_online" | "in_conversation_with">,
  capturedMode: CapturedSessionMode | null,
): VisitorDisplayStatus {
  if (capturedMode === "takeover" || row.in_conversation_with) {
    return "in-conversation";
  }
  return row.visitor_online ? "online" : "offline";
}

export function normalizeChatSessionRow(
  row: ChatSessionListRow,
  capturedMode: CapturedSessionMode | null,
): ActiveVisitor {
  const visitor_online = row.visitor_online ?? false;
  const in_conversation_with = row.in_conversation_with ?? null;
  const in_conversation_with_name = row.in_conversation_with_name ?? null;

  return {
    agent_id: row.agent_id,
    chat_session_id: row.chat_session_id,
    created_at: row.created_at ?? "",
    last_message_at: row.last_message_at,
    last_connected_at: row.last_connected_at ?? "",
    sid: row.sid ?? null,
    alias_name: row.alias_name,
    newly_joined: row.newly_joined ?? false,
    visitor_online,
    in_conversation_with,
    in_conversation_with_name,
    status: deriveVisitorDisplayStatus(
      { visitor_online, in_conversation_with },
      capturedMode,
    ),
    geo_data: row.geo_data,
    visitor_at: row.visitor_at,
    color: row.color || "",
  };
}

/** Tooltip label for who holds an active human takeover. */
export function formatInConversationHandlerLabel(
  handlerUserId: string | null | undefined,
  handlerName: string | null | undefined,
  currentUserId: string,
): string | null {
  if (!handlerUserId) return null;
  if (handlerUserId === currentUserId) return "with You";
  const name = handlerName?.trim();
  return name ? `with ${name}` : "with another team member";
}

/** Monitor banner when another team member holds takeover. */
export function formatPeerTakeoverBannerMessage(
  handlerName: string | null | undefined,
): string {
  const name = handlerName?.trim();
  return name
    ? `${name} is handling this chat`
    : "Another team member is handling this chat";
}

/** Open a chat panel — monitor from Chat Sessions list, takeover from Messaging. */
export function captureChatSession(
  dispatch: AppDispatch,
  {
    agent_id,
    user_id,
    chat_session_id,
    in_conversation_with,
    in_conversation_with_name,
    team_role,
    openAs = "monitor",
  }: {
    agent_id: string;
    user_id: string;
    chat_session_id: string;
    in_conversation_with?: string | null;
    in_conversation_with_name?: string | null;
    team_role?: TeamRole | null;
    openAs?: "monitor" | "takeover";
  },
) {
  const isPeerTakeover =
    !!in_conversation_with && in_conversation_with !== user_id;
  const isOwnTakeover =
    !!in_conversation_with && in_conversation_with === user_id;

  if (isPeerTakeoverMonitorBlocked(team_role, in_conversation_with, user_id)) {
    const handlerName = in_conversation_with_name?.trim();
    toast.error(
      handlerName
        ? `${handlerName} is handling this chat. You cannot monitor it.`
        : "This chat is being handled by another team member. You cannot monitor it.",
    );
    return;
  }

  if (openAs === "takeover" && isPeerTakeover) {
    toast.error("This chat is already handled by another team member");
    if (canMonitorDuringActiveTakeover(team_role)) {
      openAs = "monitor";
    } else {
      return;
    }
  }

  const conversation_mode: CapturedSessionMode =
    openAs === "takeover" || isOwnTakeover ? "takeover" : "monitor";

  dispatch(
    addCapturedSession({
      chat_session_id,
      captured_at: new Date().toISOString(),
      conversation_mode,
    }),
  );

  if (conversation_mode === "takeover") {
    emitStartTakeoverConversation(agent_id, chat_session_id);
  } else {
    emitStartMonitorConversation(agent_id, chat_session_id);
  }
}
