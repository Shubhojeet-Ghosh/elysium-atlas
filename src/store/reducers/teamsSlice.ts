import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { UserTeam } from "@/types/auth";
import type { TeamSelectionPending } from "@/utils/authLogin";
import type { TeamsState } from "../types/TeamsTypes";

const initialState: TeamsState = {
  list: [],
  selectionPending: null,
  selectionRedirectPath: null,
};

const teamsSlice = createSlice({
  name: "teams",
  initialState,
  reducers: {
    setTeams: (state, action: PayloadAction<UserTeam[]>) => {
      state.list = action.payload;
    },
    setTeamSelectionPending: (
      state,
      action: PayloadAction<{
        pending: TeamSelectionPending;
        redirectPath?: string;
      }>,
    ) => {
      state.selectionPending = action.payload.pending;
      state.selectionRedirectPath = action.payload.redirectPath ?? null;
    },
    clearTeamSelection: (state) => {
      state.selectionPending = null;
      state.selectionRedirectPath = null;
    },
    resetTeams: (state) => {
      state.list = [];
      state.selectionPending = null;
      state.selectionRedirectPath = null;
    },
  },
});

export const {
  setTeams,
  setTeamSelectionPending,
  clearTeamSelection,
  resetTeams,
} = teamsSlice.actions;

export const teamsReducer = teamsSlice.reducer;
