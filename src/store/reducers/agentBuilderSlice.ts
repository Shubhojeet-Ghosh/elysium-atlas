import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AgentBuilderState,
  FileMetadata,
  KnowledgeBaseLink,
  CustomText,
} from "../types/AgentBuilderTypes";

const initialState: AgentBuilderState = {
  currentStep: 0,
  agentName: "",
  knowledgeBase: "",
  knowledgeBaseSitemap: "",
  knowledgeBaseLinks: [],
  knowledgeBaseFiles: [],
  knowledgeBaseText: [],
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
        (item) => item.name !== action.payload
      );
    },
    setKnowledgeBaseText: (state, action: PayloadAction<CustomText[]>) => {
      state.knowledgeBaseText = action.payload;
    },
    addKnowledgeBaseText: (state, action: PayloadAction<CustomText>) => {
      const newItem: CustomText = {
        ...action.payload,
        lastUpdated: action.payload.lastUpdated || new Date().toISOString(),
      };
      state.knowledgeBaseText.push(newItem);
    },
    updateKnowledgeBaseText: (
      state,
      action: PayloadAction<{ index: number; customText: CustomText }>
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
        (_, index) => index !== action.payload
      );
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
      state.knowledgeBaseText = [];
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
  toggleKnowledgeBaseFile,
  toggleAllKnowledgeBaseFiles,
  removeKnowledgeBaseFile,
  setKnowledgeBaseText,
  addKnowledgeBaseText,
  updateKnowledgeBaseText,
  removeKnowledgeBaseText,
  setBaseURL,
  resetAgentBuilder,
} = agentBuilderSlice.actions;

export const agentBuilderReducer = agentBuilderSlice.reducer;
