import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SettingsState } from "../types/SettingsTypes";

const initialState: SettingsState = {
  theme: "light",
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<"light" | "dark" | "system">) => {
      state.theme = action.payload;
    },
  },
});

export const { setTheme } = settingsSlice.actions;

export const settingsReducer = settingsSlice.reducer;
