import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AgentBuilderState, FileMetadata } from "../types/AgentBuilderTypes";

const initialState: AgentBuilderState = {
  currentStep: 0,
  agentName: "",
  knowledgeBase: "",
  knowledgeBaseSitemap: "",
  knowledgeBaseLinks: [],
  knowledgeBaseFiles: [],
  knowledgeBaseText: "",
  baseURL: "",
};

const agentBuilderSlice = createSlice({
  name: "agentBuilder",
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    setAgentName: (state, action: PayloadAction<string>) => {
      state.agentName = action.payload;
    },
    setKnowledgeBase: (state, action: PayloadAction<string>) => {
      state.knowledgeBase = action.payload;
    },
    setKnowledgeBaseSitemap: (state, action: PayloadAction<string>) => {
      state.knowledgeBaseSitemap = action.payload;
    },
    setKnowledgeBaseLinks: (state, action: PayloadAction<string[]>) => {
      state.knowledgeBaseLinks = action.payload;
    },
    setKnowledgeBaseFiles: (state, action: PayloadAction<FileMetadata[]>) => {
      state.knowledgeBaseFiles = action.payload;
    },
    setKnowledgeBaseText: (state, action: PayloadAction<string>) => {
      state.knowledgeBaseText = action.payload;
    },
    setBaseURL: (state, action: PayloadAction<string>) => {
      state.baseURL = action.payload;
    },
    resetAgentBuilder: (state) => {
      state.currentStep = 0;
      state.agentName = "";
      state.knowledgeBase = "";
      state.knowledgeBaseSitemap = "";
      state.knowledgeBaseLinks = [];
      state.knowledgeBaseFiles = [];
      state.knowledgeBaseText = "";
      state.baseURL = "";
    },
  },
});

export const {
  setCurrentStep,
  setAgentName,
  setKnowledgeBase,
  setKnowledgeBaseSitemap,
  setKnowledgeBaseLinks,
  setKnowledgeBaseFiles,
  setKnowledgeBaseText,
  setBaseURL,
  resetAgentBuilder,
} = agentBuilderSlice.actions;

export const agentBuilderReducer = agentBuilderSlice.reducer;
