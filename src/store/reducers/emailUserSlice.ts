import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EmailUserState, EmailUserRole } from "../types/EmailUserTypes";

const initialState: EmailUserState = {
  userID: "",
  name: "",
  email: "",
  teamID: "",
  departmentID: "",
  departmentName: "",
  role: "",
};

const emailUserSlice = createSlice({
  name: "emailUser",
  initialState,
  reducers: {
    setEmailUserID: (state, action: PayloadAction<string>) => {
      state.userID = action.payload;
    },
    setEmailUserName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    setEmailUserEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload;
    },
    setEmailUserTeamID: (state, action: PayloadAction<string>) => {
      state.teamID = action.payload;
    },
    setEmailUserDepartmentID: (state, action: PayloadAction<string>) => {
      state.departmentID = action.payload;
    },
    setEmailUserDepartmentName: (state, action: PayloadAction<string>) => {
      state.departmentName = action.payload;
    },
    setEmailUserRole: (state, action: PayloadAction<EmailUserRole | "">) => {
      state.role = action.payload;
    },
    setEmailUser: (state, action: PayloadAction<EmailUserState>) => {
      return action.payload;
    },
    resetEmailUser: () => initialState,
  },
});

export const {
  setEmailUserID,
  setEmailUserName,
  setEmailUserEmail,
  setEmailUserTeamID,
  setEmailUserDepartmentID,
  setEmailUserDepartmentName,
  setEmailUserRole,
  setEmailUser,
  resetEmailUser,
} = emailUserSlice.actions;

export const emailUserReducer = emailUserSlice.reducer;
