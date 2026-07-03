import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  FileMetadata,
  KnowledgeBaseLink,
  CustomText,
  QnA,
} from "../types/AgentBuilderTypes";
import {
  type ChatSessionListRow,
  deriveVisitorDisplayStatus,
  normalizeChatSessionRow,
} from "@/utils/chatSessionListUtils";

export interface GeoData {
  country_name: string | null;
  country_flag: string | null;
  district: string | null;
  ip: string | null;
  time_zone: string | null;
}

export interface ConversationMessage {
  message_id: string;
  /** MongoDB _id — used for mark-chat-message-read when available */
  _id?: string;
  role: "user" | "agent" | "human";
  content: string;
  created_at: string;
  /** @deprecated Prefer read_at- kept for backwards compatibility */
  is_read?: boolean;
  read_at?: string | null;
}

export interface ActiveVisitor {
  agent_id: string;
  chat_session_id: string;
  created_at: string;
  last_message_at: string | null;
  last_connected_at: string;
  sid: string | null;
  alias_name: string | null;
  newly_joined: boolean;
  status: string;
  /** From Redis overlay — true when visitor socket is connected. */
  visitor_online: boolean;
  /** Team member user_id during active human takeover (Mongo; Redis overlay when online). */
  in_conversation_with: string | null;
  /** Full name of the handling team member when takeover is active. */
  in_conversation_with_name: string | null;
  geo_data: GeoData | null;
  visitor_at: string | null;
  color: string;
}

export type CapturedSessionMode = "monitor" | "takeover";

export interface TeamMemberConversationLog {
  chat_session_id: string;
  alias_name: string | null;
  agent_id: string;
  last_message: string | null;
  last_message_at: string | null;
  captured_at: string;
  ended_at: string | null;
  /** "live" = currently in captured_sessions, "ended" = conversation closed */
  status: "live" | "ended";
  unread_count: number;
  /** true when there are unread messages for this log */
  is_unread: boolean;
  color: string;
  geo_data: GeoData | null;
}

interface UserAgentState {
  agentName: string;
  agentID: string;
  baseURL: string;
  knowledgeBaseSitemap: string;
  knowledgeBaseLinks: KnowledgeBaseLink[];
  knowledgeBaseFiles: FileMetadata[];
  knowledgeBaseText: CustomText[];
  knowledgeBaseQnA: QnA[];
  agent_status: string;
  agent_current_task: string;
  progress: number;
  systemPrompt: string;
  temperature: number;
  welcomeMessage: string;
  llmModel: string;
  retrievalStrategy: string;
  toolIds: string[];
  triggerGetAgentDetails: number;
  triggerFetchAgentUrls: number;
  triggerFetchAgentFiles: number;
  triggerFetchAgentCustomTexts: number;
  triggerFetchAgentQnA: number;
  triggerFetchTeamMemberChatSessions: number;
  widget_script: string | null;
  agent_icon: string | null;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  active_visitors: ActiveVisitor[];
  captured_sessions: (ActiveVisitor & {
    captured_at: string;
    is_expanded: boolean;
    conversation_mode: CapturedSessionMode;
    conversation_chain: ConversationMessage[];
  })[];
  team_member_conversation_logs: TeamMemberConversationLog[];
}

const initialState: UserAgentState = {
  agentName: "",
  agentID: "",
  baseURL: "",
  knowledgeBaseSitemap: "",
  knowledgeBaseLinks: [],
  knowledgeBaseFiles: [],
  knowledgeBaseText: [],
  knowledgeBaseQnA: [],
  agent_status: "",
  agent_current_task: "",
  progress: 0,
  systemPrompt: "",
  temperature: 0,
  welcomeMessage: "",
  llmModel: "",
  retrievalStrategy: "simple",
  toolIds: [],
  triggerGetAgentDetails: 0,
  triggerFetchAgentUrls: 0,
  triggerFetchAgentFiles: 0,
  triggerFetchAgentCustomTexts: 0,
  triggerFetchAgentQnA: 0,
  triggerFetchTeamMemberChatSessions: 0,
  widget_script: null,
  agent_icon: null,
  primary_color: "#fff",
  secondary_color: "#fff",
  text_color: "#111",
  active_visitors: [],
  captured_sessions: [],
  team_member_conversation_logs: [],
};

function findCapturedSession(
  state: UserAgentState,
  chat_session_id: string,
) {
  return state.captured_sessions.find(
    (s) => s.chat_session_id === chat_session_id,
  );
}

function capturedSessionMode(
  state: UserAgentState,
  chat_session_id: string,
): CapturedSessionMode | null {
  return findCapturedSession(state, chat_session_id)?.conversation_mode ?? null;
}

function normalizeSessionForState(
  state: UserAgentState,
  row: ChatSessionListRow,
): ActiveVisitor {
  return normalizeChatSessionRow(
    row,
    capturedSessionMode(state, row.chat_session_id),
  );
}

function applyDerivedStatus(
  state: UserAgentState,
  visitor: ActiveVisitor,
): void {
  visitor.status = deriveVisitorDisplayStatus(
    {
      visitor_online: visitor.visitor_online,
      in_conversation_with: visitor.in_conversation_with,
    },
    capturedSessionMode(state, visitor.chat_session_id),
  );
}

function buildConversationLogFromSources(
  state: UserAgentState,
  chat_session_id: string,
  overrides: Partial<TeamMemberConversationLog> = {},
): TeamMemberConversationLog {
  const captured = state.captured_sessions.find(
    (s) => s.chat_session_id === chat_session_id,
  );
  const visitor = state.active_visitors.find(
    (v) => v.chat_session_id === chat_session_id,
  );
  const source = captured ?? visitor;

  return {
    chat_session_id,
    alias_name: overrides.alias_name ?? source?.alias_name ?? null,
    agent_id: overrides.agent_id ?? source?.agent_id ?? state.agentID,
    last_message: overrides.last_message ?? null,
    last_message_at: overrides.last_message_at ?? null,
    captured_at:
      overrides.captured_at ??
      captured?.captured_at ??
      source?.last_connected_at ??
      new Date().toISOString(),
    ended_at: overrides.ended_at ?? null,
    status:
      overrides.status ??
      (visitor && !visitor.visitor_online ? "ended" : "live"),
    unread_count: overrides.unread_count ?? 0,
    is_unread: overrides.is_unread ?? false,
    color: overrides.color ?? source?.color ?? "",
    geo_data: overrides.geo_data ?? source?.geo_data ?? null,
  };
}

const agentSlice = createSlice({
  name: "agent",
  initialState,
  reducers: {
    setAgentName: (state, action: PayloadAction<string>) => {
      state.agentName = action.payload;
    },
    setAgentID: (state, action: PayloadAction<string>) => {
      state.agentID = action.payload;
    },
    setBaseURL: (state, action: PayloadAction<string>) => {
      state.baseURL = action.payload;
    },
    setAgentStatus: (state, action: PayloadAction<string>) => {
      state.agent_status = action.payload;
    },
    setAgentCurrentTask: (state, action: PayloadAction<string>) => {
      state.agent_current_task = action.payload;
    },
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload;
    },
    setKnowledgeBaseSitemap: (state, action: PayloadAction<string>) => {
      state.knowledgeBaseSitemap = action.payload;
    },
    setKnowledgeBaseLinks: (
      state,
      action: PayloadAction<KnowledgeBaseLink[]>,
    ) => {
      state.knowledgeBaseLinks = action.payload;
    },
    addKnowledgeBaseLinks: (
      state,
      action: PayloadAction<{ links: string[]; checked?: boolean }>,
    ) => {
      const existingLinksSet = new Set(
        state.knowledgeBaseLinks.map((item) => item.link),
      );
      const newLinks: KnowledgeBaseLink[] = action.payload.links
        .filter((link) => !existingLinksSet.has(link))
        .map((link) => ({
          link,
          checked: action.payload.checked ?? true,
          status: "new",
          updated_at: null,
        }));
      state.knowledgeBaseLinks = [...newLinks, ...state.knowledgeBaseLinks];
    },
    toggleKnowledgeBaseLink: (state, action: PayloadAction<number>) => {
      if (state.knowledgeBaseLinks[action.payload]) {
        state.knowledgeBaseLinks[action.payload].checked =
          !state.knowledgeBaseLinks[action.payload].checked;
      }
    },
    toggleAllKnowledgeBaseLinks: (state, action: PayloadAction<boolean>) => {
      state.knowledgeBaseLinks.forEach((item) => {
        item.checked = action.payload;
      });
    },
    removeKnowledgeBaseLink: (state, action: PayloadAction<string>) => {
      state.knowledgeBaseLinks = state.knowledgeBaseLinks.filter(
        (item) => item.link !== action.payload,
      );
    },
    setKnowledgeBaseFiles: (state, action: PayloadAction<FileMetadata[]>) => {
      state.knowledgeBaseFiles = action.payload;
    },
    addKnowledgeBaseFiles: (state, action: PayloadAction<FileMetadata[]>) => {
      const newFiles = action.payload.map((file) => ({
        ...file,
        status: "new",
      }));
      state.knowledgeBaseFiles = [...state.knowledgeBaseFiles, ...newFiles];
    },
    toggleKnowledgeBaseFile: (state, action: PayloadAction<number>) => {
      if (state.knowledgeBaseFiles[action.payload]) {
        state.knowledgeBaseFiles[action.payload].checked = !(
          state.knowledgeBaseFiles[action.payload].checked ?? true
        );
      }
    },
    toggleAllKnowledgeBaseFiles: (state, action: PayloadAction<boolean>) => {
      state.knowledgeBaseFiles.forEach((item) => {
        item.checked = action.payload;
      });
    },
    removeKnowledgeBaseFile: (state, action: PayloadAction<string>) => {
      state.knowledgeBaseFiles = state.knowledgeBaseFiles.filter(
        (item) => item.name !== action.payload,
      );
    },
    setFileChecked: (
      state,
      action: PayloadAction<{ name: string; checked: boolean }>,
    ) => {
      const file = state.knowledgeBaseFiles.find(
        (f) => f.name === action.payload.name,
      );
      if (file) {
        file.checked = action.payload.checked;
      }
    },
    setKnowledgeBaseText: (state, action: PayloadAction<CustomText[]>) => {
      state.knowledgeBaseText = action.payload;
    },
    addKnowledgeBaseText: (state, action: PayloadAction<CustomText>) => {
      const newItem: CustomText = {
        ...action.payload,
        lastUpdated: action.payload.lastUpdated || new Date().toISOString(),
        status: "new",
      };
      state.knowledgeBaseText.push(newItem);
    },
    updateKnowledgeBaseText: (
      state,
      action: PayloadAction<{ index: number; customText: CustomText }>,
    ) => {
      if (state.knowledgeBaseText[action.payload.index]) {
        state.knowledgeBaseText[action.payload.index] = {
          ...action.payload.customText,
          lastUpdated: new Date().toISOString(),
        };
      }
    },
    removeKnowledgeBaseText: (state, action: PayloadAction<number>) => {
      state.knowledgeBaseText = state.knowledgeBaseText.filter(
        (_, index) => index !== action.payload,
      );
    },
    setKnowledgeBaseQnA: (state, action: PayloadAction<QnA[]>) => {
      state.knowledgeBaseQnA = action.payload;
    },
    addKnowledgeBaseQnA: (state, action: PayloadAction<QnA>) => {
      const newItem: QnA = {
        ...action.payload,
        lastUpdated: action.payload.lastUpdated || new Date().toISOString(),
        status: "new",
      };
      state.knowledgeBaseQnA.push(newItem);
    },
    updateKnowledgeBaseQnA: (
      state,
      action: PayloadAction<{ index: number; qna: QnA }>,
    ) => {
      if (state.knowledgeBaseQnA[action.payload.index]) {
        state.knowledgeBaseQnA[action.payload.index] = {
          ...action.payload.qna,
          lastUpdated: new Date().toISOString(),
        };
      }
    },
    removeKnowledgeBaseQnA: (state, action: PayloadAction<number>) => {
      state.knowledgeBaseQnA = state.knowledgeBaseQnA.filter(
        (_, index) => index !== action.payload,
      );
    },
    setSystemPrompt: (state, action: PayloadAction<string>) => {
      state.systemPrompt = action.payload;
    },
    setTemperature: (state, action: PayloadAction<number>) => {
      state.temperature = action.payload;
    },
    setWelcomeMessage: (state, action: PayloadAction<string>) => {
      state.welcomeMessage = action.payload;
    },
    setLlmModel: (state, action: PayloadAction<string>) => {
      state.llmModel = action.payload;
    },
    setRetrievalStrategy: (state, action: PayloadAction<string>) => {
      state.retrievalStrategy = action.payload;
    },
    setToolIds: (state, action: PayloadAction<string[]>) => {
      state.toolIds = action.payload;
    },
    setTriggerGetAgentDetails: (state, action: PayloadAction<number>) => {
      state.triggerGetAgentDetails = action.payload;
    },
    setTriggerFetchAgentUrls: (state, action: PayloadAction<number>) => {
      state.triggerFetchAgentUrls = action.payload;
    },
    setTriggerFetchAgentFiles: (state, action: PayloadAction<number>) => {
      state.triggerFetchAgentFiles = action.payload;
    },
    setTriggerFetchAgentCustomTexts: (state, action: PayloadAction<number>) => {
      state.triggerFetchAgentCustomTexts = action.payload;
    },
    setTriggerFetchAgentQnA: (state, action: PayloadAction<number>) => {
      state.triggerFetchAgentQnA = action.payload;
    },
    triggerFetchTeamMemberChatSessions: (state) => {
      state.triggerFetchTeamMemberChatSessions += 1;
    },
    setWidgetScript: (state, action: PayloadAction<string | null>) => {
      state.widget_script = action.payload;
    },
    setAgentIcon: (state, action: PayloadAction<string | null>) => {
      state.agent_icon = action.payload;
    },
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primary_color = action.payload;
    },
    setSecondaryColor: (state, action: PayloadAction<string>) => {
      state.secondary_color = action.payload;
    },
    setTextColor: (state, action: PayloadAction<string>) => {
      state.text_color = action.payload;
    },
    addActiveVisitor: (state, action: PayloadAction<ChatSessionListRow>) => {
      const visitor = normalizeSessionForState(state, {
        ...action.payload,
        visitor_online: action.payload.visitor_online ?? true,
        newly_joined: true,
      });
      state.active_visitors = [...state.active_visitors, visitor];
    },
    upsertActiveVisitor: (state, action: PayloadAction<ChatSessionListRow>) => {
      const existing = state.active_visitors.find(
        (v) => v.chat_session_id === action.payload.chat_session_id,
      );
      const normalized = normalizeSessionForState(state, {
        ...action.payload,
        visitor_online: action.payload.visitor_online ?? true,
        newly_joined: existing ? false : true,
      });
      if (existing) {
        Object.assign(existing, normalized, { newly_joined: false });
      } else {
        state.active_visitors = [...state.active_visitors, normalized];
      }
    },
    reconnectActiveVisitorIfPresent: (
      state,
      action: PayloadAction<ChatSessionListRow>,
    ) => {
      const existing = state.active_visitors.find(
        (v) => v.chat_session_id === action.payload.chat_session_id,
      );
      if (!existing) return;

      existing.visitor_online = action.payload.visitor_online ?? true;
      existing.sid = action.payload.sid ?? existing.sid;
      existing.in_conversation_with =
        action.payload.in_conversation_with ?? existing.in_conversation_with;
      if (action.payload.in_conversation_with_name !== undefined) {
        existing.in_conversation_with_name =
          action.payload.in_conversation_with_name;
      }
      existing.newly_joined = false;
      if (action.payload.last_connected_at) {
        existing.last_connected_at = action.payload.last_connected_at;
      }
      if (action.payload.last_message_at != null) {
        existing.last_message_at = action.payload.last_message_at;
      }
      if (action.payload.alias_name != null) {
        existing.alias_name = action.payload.alias_name;
      }
      if (action.payload.geo_data) {
        existing.geo_data = action.payload.geo_data;
      }
      applyDerivedStatus(state, existing);
    },
    setActiveVisitors: (state, action: PayloadAction<ChatSessionListRow[]>) => {
      const seen = new Set<string>();
      state.active_visitors = action.payload
        .filter((row) => {
          if (!row.chat_session_id || seen.has(row.chat_session_id)) {
            return false;
          }
          seen.add(row.chat_session_id);
          return true;
        })
        .map((row) => normalizeSessionForState(state, row));
    },
    updateActiveVisitorStatus: (
      state,
      action: PayloadAction<{ chat_session_id: string; status: string }>,
    ) => {
      const visitor = state.active_visitors.find(
        (v) => v.chat_session_id === action.payload.chat_session_id,
      );
      if (visitor) {
        visitor.status = action.payload.status;
        if (action.payload.status === "offline") {
          visitor.visitor_online = false;
          visitor.sid = null;
        }
      }
    },
    updateChatSessionPresence: (
      state,
      action: PayloadAction<{
        chat_session_id: string;
        visitor_online: boolean;
        sid?: string | null;
        in_conversation_with?: string | null;
        in_conversation_with_name?: string | null;
      }>,
    ) => {
      const visitor = state.active_visitors.find(
        (v) => v.chat_session_id === action.payload.chat_session_id,
      );
      if (!visitor) return;

      visitor.visitor_online = action.payload.visitor_online;
      if (action.payload.sid !== undefined) {
        visitor.sid = action.payload.sid;
      }
      if (action.payload.in_conversation_with !== undefined) {
        visitor.in_conversation_with = action.payload.in_conversation_with;
        if (action.payload.in_conversation_with === null) {
          visitor.in_conversation_with_name = null;
        }
      }
      if (action.payload.in_conversation_with_name !== undefined) {
        visitor.in_conversation_with_name = action.payload.in_conversation_with_name;
      }
      applyDerivedStatus(state, visitor);
    },
    removeActiveVisitor: (state, action: PayloadAction<string>) => {
      state.active_visitors = state.active_visitors.filter(
        (v) => v.chat_session_id !== action.payload,
      );
    },
    addCapturedSession: (
      state,
      action: PayloadAction<{
        chat_session_id: string;
        captured_at: string;
        conversation_mode?: CapturedSessionMode;
      }>,
    ) => {
      const conversation_mode = action.payload.conversation_mode ?? "monitor";
      const existing = state.captured_sessions.find(
        (s) => s.chat_session_id === action.payload.chat_session_id,
      );
      if (existing) {
        // Already captured- just re-expand, collapse others, keep original captured_at
        state.captured_sessions.forEach((s) => {
          s.is_expanded = false;
        });
        existing.is_expanded = true;
        existing.conversation_mode = conversation_mode;
        const av = state.active_visitors.find(
          (v) => v.chat_session_id === action.payload.chat_session_id,
        );
        if (av) applyDerivedStatus(state, av);
      } else {
        // Prefer full visitor data from active_visitors when present, but
        // also merge in geo/color/name from team_member_conversation_logs
        // since many historical conversations won't be in active_visitors.
        const visitor = state.active_visitors.find(
          (v) => v.chat_session_id === action.payload.chat_session_id,
        );
        const log = state.team_member_conversation_logs.find(
          (l) => l.chat_session_id === action.payload.chat_session_id,
        );

        // New session- collapse all existing, add expanded with merged data
        // New session- collapse all existing, add expanded with full visitor data
        state.captured_sessions.forEach((s) => {
          s.is_expanded = false;
        });
        const baseVisitor: ActiveVisitor = {
          ...(visitor ?? {
            agent_id: "",
            chat_session_id: action.payload.chat_session_id,
            created_at: "",
            last_message_at: null,
            last_connected_at: "",
            sid: null,
            alias_name: null,
            newly_joined: false,
            status: "offline",
            visitor_online: false,
            in_conversation_with: null,
            in_conversation_with_name: null,
            geo_data: null,
            visitor_at: null,
            color: "",
          }),
        };

        const mergedVisitor: ActiveVisitor = log
          ? {
              ...baseVisitor,
              agent_id: log.agent_id,
              alias_name: log.alias_name,
              geo_data: log.geo_data,
              color: log.color || baseVisitor.color,
              last_message_at:
                log.last_message_at ?? baseVisitor.last_message_at,
            }
          : baseVisitor;

        state.captured_sessions.push({
          ...mergedVisitor,
          captured_at: action.payload.captured_at,
          is_expanded: true,
          conversation_mode,
          conversation_chain: [],
        });
        // mark the active visitor as in-conversation when we capture them
        if (visitor) {
          applyDerivedStatus(state, visitor);
        }
      }
    },
    expandCapturedSession: (state, action: PayloadAction<string>) => {
      state.captured_sessions.forEach((s) => {
        s.is_expanded = s.chat_session_id === action.payload;
      });
    },
    collapseCapturedSession: (state, action: PayloadAction<string>) => {
      const session = state.captured_sessions.find(
        (s) => s.chat_session_id === action.payload,
      );
      if (session) session.is_expanded = false;
    },
    removeCapturedSession: (state, action: PayloadAction<string>) => {
      state.captured_sessions = state.captured_sessions.filter(
        (s) => s.chat_session_id !== action.payload,
      );
      const visitor = state.active_visitors.find(
        (v) => v.chat_session_id === action.payload,
      );
      if (visitor) {
        applyDerivedStatus(state, visitor);
      }
    },
    clearCapturedSessions: (state) => {
      state.captured_sessions = [];
      state.active_visitors.forEach((visitor) => applyDerivedStatus(state, visitor));
    },
    setCapturedSessionMode: (
      state,
      action: PayloadAction<{
        chat_session_id: string;
        conversation_mode: CapturedSessionMode;
      }>,
    ) => {
      const session = state.captured_sessions.find(
        (s) => s.chat_session_id === action.payload.chat_session_id,
      );
      if (!session) return;

      session.conversation_mode = action.payload.conversation_mode;
      const visitor = state.active_visitors.find(
        (v) => v.chat_session_id === action.payload.chat_session_id,
      );
      if (visitor) applyDerivedStatus(state, visitor);
    },
    setCapturedSessions: (
      state,
      action: PayloadAction<
        (ActiveVisitor & {
          captured_at: string;
          is_expanded: boolean;
          conversation_mode?: CapturedSessionMode;
          conversation_chain: ConversationMessage[];
        })[]
      >,
    ) => {
      state.captured_sessions = action.payload.map((session) => ({
        ...session,
        conversation_mode: session.conversation_mode ?? "monitor",
      }));
    },
    addMessageToCapturedSession: (
      state,
      action: PayloadAction<{
        chat_session_id: string;
        message: ConversationMessage;
      }>,
    ) => {
      const session = state.captured_sessions.find(
        (s) => s.chat_session_id === action.payload.chat_session_id,
      );
      if (session) {
        session.conversation_chain.push(action.payload.message);
      }
    },
    markSessionMessagesAsRead: (state, action: PayloadAction<string>) => {
      const session = state.captured_sessions.find(
        (s) => s.chat_session_id === action.payload,
      );
      if (session) {
        const readAt = new Date().toISOString();
        session.conversation_chain.forEach((m) => {
          if (m.role === "user" && !m.read_at) {
            m.read_at = readAt;
            m.is_read = true;
          }
        });
      }
    },
    markCapturedMessageAsRead: (
      state,
      action: PayloadAction<{
        chat_session_id: string;
        message_id: string;
        _id?: string | null;
        read_at: string;
      }>,
    ) => {
      const session = state.captured_sessions.find(
        (s) => s.chat_session_id === action.payload.chat_session_id,
      );
      if (session) {
        const { message_id, _id, read_at } = action.payload;
        const message = session.conversation_chain.find(
          (m) =>
            m.message_id === message_id ||
            (_id != null && m._id != null && m._id === _id) ||
            (m._id != null && m._id === message_id),
        );
        if (message) {
          message.read_at = read_at;
          message.is_read = true;
        }
      }
    },
    setConversationChainForSession: (
      state,
      action: PayloadAction<{
        chat_session_id: string;
        conversation_chain: ConversationMessage[];
      }>,
    ) => {
      const session = state.captured_sessions.find(
        (s) => s.chat_session_id === action.payload.chat_session_id,
      );
      if (session) {
        session.conversation_chain = action.payload.conversation_chain;
      }
    },
    setTeamMemberConversationLogs: (
      state,
      action: PayloadAction<TeamMemberConversationLog[]>,
    ) => {
      state.team_member_conversation_logs = action.payload;
    },
    addOrUpdateConversationLog: (
      state,
      action: PayloadAction<
        Partial<TeamMemberConversationLog> & { chat_session_id: string }
      >,
    ) => {
      const idx = state.team_member_conversation_logs.findIndex(
        (l) => l.chat_session_id === action.payload.chat_session_id,
      );
      if (idx !== -1) {
        const existing = state.team_member_conversation_logs[idx];
        state.team_member_conversation_logs[idx] = {
          ...existing,
          ...action.payload,
          is_unread:
            action.payload.is_unread !== undefined
              ? action.payload.is_unread
              : (existing.is_unread ?? false),
          unread_count:
            action.payload.unread_count !== undefined
              ? action.payload.unread_count
              : (existing.unread_count ?? 0),
        };
      } else {
        state.team_member_conversation_logs.unshift(
          buildConversationLogFromSources(
            state,
            action.payload.chat_session_id,
            {
              ...action.payload,
              is_unread: action.payload.is_unread ?? false,
              unread_count: action.payload.unread_count ?? 0,
            },
          ),
        );
      }
    },
    updateConversationLogLastMessage: (
      state,
      action: PayloadAction<{
        chat_session_id: string;
        last_message: string | null;
        last_message_at: string | null;
        /** When true, creates the log if missing (first agent message) */
        from_agent?: boolean;
      }>,
    ) => {
      const idx = state.team_member_conversation_logs.findIndex(
        (l) => l.chat_session_id === action.payload.chat_session_id,
      );
      if (idx === -1) {
        if (!action.payload.from_agent) return;

        state.team_member_conversation_logs.unshift(
          buildConversationLogFromSources(
            state,
            action.payload.chat_session_id,
            {
              last_message: action.payload.last_message,
              last_message_at: action.payload.last_message_at,
            },
          ),
        );
        return;
      }

      const log = state.team_member_conversation_logs[idx];
      log.last_message = action.payload.last_message;
      log.last_message_at = action.payload.last_message_at;
      state.team_member_conversation_logs.splice(idx, 1);
      state.team_member_conversation_logs.unshift(log);
    },
    markConversationLogAsRead: (state, action: PayloadAction<string>) => {
      const log = state.team_member_conversation_logs.find(
        (l) => l.chat_session_id === action.payload,
      );
      if (log) {
        log.unread_count = 0;
        log.is_unread = false;
      }
    },
    incrementConversationLogUnread: (state, action: PayloadAction<string>) => {
      const log = state.team_member_conversation_logs.find(
        (l) => l.chat_session_id === action.payload,
      );
      if (!log) return;

      log.unread_count = (log.unread_count ?? 0) + 1;
      log.is_unread = true;
    },
    setCapturedSessionAlias: (
      state,
      action: PayloadAction<{
        chat_session_id: string;
        alias_name: string | null;
      }>,
    ) => {
      const { chat_session_id, alias_name } = action.payload;
      const session = state.captured_sessions.find(
        (s) => s.chat_session_id === chat_session_id,
      );
      if (session) {
        session.alias_name = alias_name;
      }
      const visitor = state.active_visitors.find(
        (v) => v.chat_session_id === chat_session_id,
      );
      if (visitor) {
        visitor.alias_name = alias_name;
      }
    },
    resetUserAgent: (state) => {
      state.agentName = "";
      state.agentID = "";
      state.baseURL = "";
      state.knowledgeBaseSitemap = "";
      state.knowledgeBaseLinks = [];
      state.knowledgeBaseFiles = [];
      state.knowledgeBaseText = [];
      state.knowledgeBaseQnA = [];
      state.agent_status = "";
      state.agent_current_task = "";
      state.progress = 0;
      state.systemPrompt = "";
      state.temperature = 0;
      state.welcomeMessage = "";
      state.llmModel = "";
      state.retrievalStrategy = "simple";
      state.toolIds = [];
      state.triggerGetAgentDetails = 0;
      state.triggerFetchAgentUrls = 0;
      state.triggerFetchAgentFiles = 0;
      state.triggerFetchAgentCustomTexts = 0;
      state.triggerFetchAgentQnA = 0;
      state.triggerFetchTeamMemberChatSessions = 0;
      state.widget_script = null;
      state.agent_icon = null;
      state.primary_color = "#fff";
      state.secondary_color = "#fff";
      state.text_color = "#111";
      state.active_visitors = [];
      state.captured_sessions = [];
      state.team_member_conversation_logs = [];
    },
  },
});

export const {
  setAgentName,
  setAgentID,
  setBaseURL,
  setAgentStatus,
  setAgentCurrentTask,
  setProgress,
  setKnowledgeBaseSitemap,
  setKnowledgeBaseLinks,
  addKnowledgeBaseLinks,
  toggleKnowledgeBaseLink,
  toggleAllKnowledgeBaseLinks,
  removeKnowledgeBaseLink,
  setKnowledgeBaseFiles,
  addKnowledgeBaseFiles,
  toggleKnowledgeBaseFile,
  toggleAllKnowledgeBaseFiles,
  removeKnowledgeBaseFile,
  setFileChecked,
  setKnowledgeBaseText,
  addKnowledgeBaseText,
  updateKnowledgeBaseText,
  removeKnowledgeBaseText,
  setKnowledgeBaseQnA,
  addKnowledgeBaseQnA,
  updateKnowledgeBaseQnA,
  removeKnowledgeBaseQnA,
  setSystemPrompt,
  setTemperature,
  setWelcomeMessage,
  setLlmModel,
  setRetrievalStrategy,
  setToolIds,
  setTriggerGetAgentDetails,
  setTriggerFetchAgentUrls,
  setTriggerFetchAgentFiles,
  setTriggerFetchAgentCustomTexts,
  setTriggerFetchAgentQnA,
  triggerFetchTeamMemberChatSessions,
  setWidgetScript,
  setAgentIcon,
  setPrimaryColor,
  setSecondaryColor,
  setTextColor,
  addActiveVisitor,
  upsertActiveVisitor,
  reconnectActiveVisitorIfPresent,
  setActiveVisitors,
  updateActiveVisitorStatus,
  updateChatSessionPresence,
  removeActiveVisitor,
  addCapturedSession,
  removeCapturedSession,
  clearCapturedSessions,
  setCapturedSessions,
  addMessageToCapturedSession,
  markSessionMessagesAsRead,
  markCapturedMessageAsRead,
  setConversationChainForSession,
  setCapturedSessionAlias,
  setCapturedSessionMode,
  expandCapturedSession,
  collapseCapturedSession,
  setTeamMemberConversationLogs,
  addOrUpdateConversationLog,
  updateConversationLogLastMessage,
  markConversationLogAsRead,
  incrementConversationLogUnread,
  resetUserAgent,
} = agentSlice.actions;

export const agentReducer = agentSlice.reducer;
