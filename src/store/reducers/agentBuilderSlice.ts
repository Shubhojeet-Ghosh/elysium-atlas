import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AgentBuilderState,
  FileMetadata,
  KnowledgeBaseLink,
} from "../types/AgentBuilderTypes";

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
    setKnowledgeBaseLinks: (
      state,
      action: PayloadAction<KnowledgeBaseLink[]>
    ) => {
      state.knowledgeBaseLinks = action.payload;
    },
    addKnowledgeBaseLinks: (
      state,
      action: PayloadAction<{ links: string[]; checked?: boolean }>
    ) => {
      const existingLinksSet = new Set(
        state.knowledgeBaseLinks.map((item) => item.link)
      );
      const newLinks: KnowledgeBaseLink[] = action.payload.links
        .filter((link) => !existingLinksSet.has(link))
        .map((link) => ({
          link,
          checked: action.payload.checked ?? true,
        }));
      state.knowledgeBaseLinks = [...state.knowledgeBaseLinks, ...newLinks];
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
        (item) => item.link !== action.payload
      );
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
  addKnowledgeBaseLinks,
  toggleKnowledgeBaseLink,
  toggleAllKnowledgeBaseLinks,
  removeKnowledgeBaseLink,
  setKnowledgeBaseFiles,
  setKnowledgeBaseText,
  setBaseURL,
  resetAgentBuilder,
} = agentBuilderSlice.actions;

export const agentBuilderReducer = agentBuilderSlice.reducer;
