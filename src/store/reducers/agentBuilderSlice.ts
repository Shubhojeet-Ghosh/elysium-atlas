import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AgentBuilderState,
  FileMetadata,
  KnowledgeBaseLink,
  CustomText,
  QnA,
} from "../types/AgentBuilderTypes";

const initialState: AgentBuilderState = {
  currentStep: 0,
  agentName: "",
  agentID: "",
  knowledgeBaseSitemap: "",
  knowledgeBaseLinks: [],
  knowledgeBaseFiles: [],
  knowledgeBaseText: [],
  knowledgeBaseQnA: [],
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
    setAgentID: (state, action: PayloadAction<string>) => {
      state.agentID = action.payload;
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
    setBaseURL: (state, action: PayloadAction<string>) => {
      state.baseURL = action.payload;
    },
    resetAgentBuilder: (state) => {
      state.currentStep = 0;
      state.agentName = "";
      state.agentID = "";
      state.knowledgeBaseSitemap = "";
      state.knowledgeBaseLinks = [];
      state.knowledgeBaseFiles = [];
      state.knowledgeBaseText = [];
      state.knowledgeBaseQnA = [];
      state.baseURL = "";
    },
  },
});

export const {
  setCurrentStep,
  setAgentName,
  setAgentID,
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
  setBaseURL,
  resetAgentBuilder,
} = agentBuilderSlice.actions;

export const agentBuilderReducer = agentBuilderSlice.reducer;
