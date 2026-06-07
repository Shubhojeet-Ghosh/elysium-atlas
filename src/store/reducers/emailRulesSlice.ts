import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { EmailRulesState } from "../types/EmailRulesTypes";
import type { EmailRecipientRule } from "@/utils/emailRecipientRulesApi";
import type { EmailRoutingRule } from "@/utils/emailRoutingRulesApi";

const initialState: EmailRulesState = {
  teamID: "",
  routingRules: [],
  recipientRules: [],
  isLoaded: false,
};

const emailRulesSlice = createSlice({
  name: "emailRules",
  initialState,
  reducers: {
    setEmailRules: (
      state,
      action: PayloadAction<{
        teamID: string;
        routingRules: EmailRoutingRule[];
        recipientRules: EmailRecipientRule[];
      }>,
    ) => {
      state.teamID = action.payload.teamID;
      state.routingRules = action.payload.routingRules;
      state.recipientRules = action.payload.recipientRules;
      state.isLoaded = true;
    },
    resetEmailRules: () => initialState,
  },
});

export const { setEmailRules, resetEmailRules } = emailRulesSlice.actions;

export const emailRulesReducer = emailRulesSlice.reducer;
