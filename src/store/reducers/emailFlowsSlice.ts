import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  EmailFlowSummary,
  EmailFlowsState,
} from "../types/EmailFlowsTypes";

const initialState: EmailFlowsState = {
  teamID: "",
  flows: [],
  isLoaded: false,
};

const emailFlowsSlice = createSlice({
  name: "emailFlows",
  initialState,
  reducers: {
    setEmailFlows: (
      state,
      action: PayloadAction<{
        teamID: string;
        flows: EmailFlowSummary[];
      }>,
    ) => {
      state.teamID = action.payload.teamID;
      state.flows = action.payload.flows;
      state.isLoaded = true;
    },
    resetEmailFlows: () => initialState,
  },
});

export const { setEmailFlows, resetEmailFlows } = emailFlowsSlice.actions;

export const emailFlowsReducer = emailFlowsSlice.reducer;
