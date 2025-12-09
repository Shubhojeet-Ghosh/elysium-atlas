import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SettingsState } from "../types/SettingsTypes";

const initialState: SettingsState = {
  theme: "light",
  isLeftNavOpen: true,
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
  },
});

export const { setTheme, setLeftNavOpen, toggleLeftNav } =
  settingsSlice.actions;

export const settingsReducer = settingsSlice.reducer;
