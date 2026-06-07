import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  EmailToolDefinition,
  EmailToolsState,
} from "../types/EmailToolsTypes";

const initialState: EmailToolsState = {
  teamID: "",
  tools: [],
  isLoaded: false,
};

const emailToolsSlice = createSlice({
  name: "emailTools",
  initialState,
  reducers: {
    setEmailTools: (
      state,
      action: PayloadAction<{
        teamID: string;
        tools: EmailToolDefinition[];
      }>,
    ) => {
      state.teamID = action.payload.teamID;
      state.tools = action.payload.tools;
      state.isLoaded = true;
    },
    resetEmailTools: () => initialState,
  },
});

export const { setEmailTools, resetEmailTools } = emailToolsSlice.actions;

export const emailToolsReducer = emailToolsSlice.reducer;
