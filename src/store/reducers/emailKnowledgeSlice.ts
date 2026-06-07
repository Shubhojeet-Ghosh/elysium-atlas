import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  EmailKnowledgeItem,
  EmailKnowledgeState,
} from "../types/EmailKnowledgeTypes";

const initialState: EmailKnowledgeState = {
  teamID: "",
  knowledgeItems: [],
  isLoaded: false,
};

const emailKnowledgeSlice = createSlice({
  name: "emailKnowledge",
  initialState,
  reducers: {
    setEmailKnowledge: (
      state,
      action: PayloadAction<{
        teamID: string;
        knowledgeItems: EmailKnowledgeItem[];
      }>,
    ) => {
      state.teamID = action.payload.teamID;
      state.knowledgeItems = action.payload.knowledgeItems;
      state.isLoaded = true;
    },
    resetEmailKnowledge: () => initialState,
  },
});

export const { setEmailKnowledge, resetEmailKnowledge } =
  emailKnowledgeSlice.actions;

export const emailKnowledgeReducer = emailKnowledgeSlice.reducer;
