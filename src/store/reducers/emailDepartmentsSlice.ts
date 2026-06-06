import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  EmailDepartment,
  EmailDepartmentsState,
} from "../types/EmailDepartmentsTypes";

const initialState: EmailDepartmentsState = {
  teamID: "",
  departments: [],
  isLoaded: false,
};

const emailDepartmentsSlice = createSlice({
  name: "emailDepartments",
  initialState,
  reducers: {
    setEmailDepartments: (
      state,
      action: PayloadAction<{
        teamID: string;
        departments: EmailDepartment[];
      }>,
    ) => {
      state.teamID = action.payload.teamID;
      state.departments = action.payload.departments;
      state.isLoaded = true;
    },
    resetEmailDepartments: () => initialState,
  },
});

export const { setEmailDepartments, resetEmailDepartments } =
  emailDepartmentsSlice.actions;

export const emailDepartmentsReducer = emailDepartmentsSlice.reducer;
