import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserPlanState {
  plan: object | null;
  originalLimits: object | null;
  availableLimits: object | null;
}

const initialState: UserPlanState = {
  plan: null,
  originalLimits: null,
  availableLimits: null,
};

const userPlanSlice = createSlice({
  name: "userPlan",
  initialState,
  reducers: {
    setPlan: (state, action: PayloadAction<object | null>) => {
      state.plan = action.payload;
    },
    setOriginalLimits: (state, action: PayloadAction<object | null>) => {
      state.originalLimits = action.payload;
    },
    setAvailableLimits: (state, action: PayloadAction<object | null>) => {
      state.availableLimits = action.payload;
    },
    resetUserPlan: (state) => {
      state.plan = null;
      state.originalLimits = null;
      state.availableLimits = null;
    },
  },
});

export const { setPlan, setOriginalLimits, setAvailableLimits, resetUserPlan } =
  userPlanSlice.actions;

export const userPlanReducer = userPlanSlice.reducer;
