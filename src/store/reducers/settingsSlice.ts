import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SettingsState } from "../types/SettingsTypes";

const initialState: SettingsState = {
  theme: "light",
  isLeftNavOpen: true,
  appVersion: "0.0.0",
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<"light" | "dark" | "system">) => {
      state.theme = action.payload;
    },
    setLeftNavOpen: (state, action: PayloadAction<boolean>) => {
      state.isLeftNavOpen = action.payload;
    },
    toggleLeftNav: (state) => {
      state.isLeftNavOpen = !state.isLeftNavOpen;
    },
    setAppVersion: (state, action: PayloadAction<string>) => {
      state.appVersion = action.payload;
    },
  },
});

export const { setTheme, setLeftNavOpen, toggleLeftNav, setAppVersion } =
  settingsSlice.actions;

export const settingsReducer = settingsSlice.reducer;
