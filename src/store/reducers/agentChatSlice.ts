import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Message {
  message_id: string;
  role: "user" | "agent" | "human";
  content: string;
  created_at: string;
}

interface AgentChatState {
  chat_session_id: string;
  agent_id: string;
  theme: "light" | "dark";
  agent_name: string;
  agent_icon: string | null;
  welcome_message: string;
  placeholder_text: string;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  quick_prompts: string[];
  agent_status: string;
  isFetching: boolean;
  isAgentOpen: boolean;
  conversation_chain: Message[];
  chatMode: "human" | "ai";
  isTyping: boolean;
}

const initialState: AgentChatState = {
  chat_session_id: "",
  agent_id: "",
  theme: "light",
  agent_name: "",
  agent_icon: null,
  welcome_message: "",
  placeholder_text: "",
  primary_color: "",
  secondary_color: "",
  text_color: "",
  quick_prompts: [],
  agent_status: "",
  isFetching: false,
  isAgentOpen: false,
  conversation_chain: [],
  chatMode: "ai",
  isTyping: false,
};

const agentChatSlice = createSlice({
  name: "agentChat",
  initialState,
  reducers: {
    setChatSessionId: (state, action: PayloadAction<string>) => {
      state.chat_session_id = action.payload;
    },
    setAgentId: (state, action: PayloadAction<string>) => {
      state.agent_id = action.payload;
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },
    setAgentFields: (
      state,
      action: PayloadAction<{
        agent_name: string;
        agent_icon: string | null;
        welcome_message: string;
        placeholder_text: string;
        primary_color: string;
        secondary_color: string;
        text_color: string;
        quick_prompts: string[];
        agent_status: string;
      }>
    ) => {
      state.agent_name = action.payload.agent_name;
      state.agent_icon = action.payload.agent_icon;
      state.welcome_message = action.payload.welcome_message;
      state.placeholder_text = action.payload.placeholder_text;
      state.primary_color = action.payload.primary_color;
      state.secondary_color = action.payload.secondary_color;
      state.text_color = action.payload.text_color;
      state.quick_prompts = action.payload.quick_prompts;
      state.agent_status = action.payload.agent_status;
    },
    setIsFetching: (state, action: PayloadAction<boolean>) => {
      state.isFetching = action.payload;
    },
    setIsAgentOpen: (state, action: PayloadAction<boolean>) => {
      state.isAgentOpen = action.payload;
    },
    setConversationChain: (state, action: PayloadAction<Message[]>) => {
      state.conversation_chain = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.conversation_chain.push(action.payload);
    },
    setChatMode: (state, action: PayloadAction<"human" | "ai">) => {
      state.chatMode = action.payload;
    },
    setIsTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    resetAgentChat: (state) => {
      state.chat_session_id = "";
      state.agent_id = "";
      state.theme = "light";
      state.agent_name = "";
      state.agent_icon = null;
      state.welcome_message = "";
      state.placeholder_text = "";
      state.primary_color = "";
      state.secondary_color = "";
      state.text_color = "";
      state.quick_prompts = [];
      state.agent_status = "";
      state.isFetching = false;
      state.isAgentOpen = false;
      state.conversation_chain = [];
      state.chatMode = "ai";
      state.isTyping = false;
    },
  },
});

export const {
  setChatSessionId,
  setAgentId,
  setTheme,
  setAgentFields,
  setIsFetching,
  setIsAgentOpen,
  setConversationChain,
  addMessage,
  setChatMode,
  setIsTyping,
  resetAgentChat,
} = agentChatSlice.actions;

export const agentChatReducer = agentChatSlice.reducer;
