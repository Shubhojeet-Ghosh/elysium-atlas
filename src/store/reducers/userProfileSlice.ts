import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserProfileState } from "../types/UserProfileTypes";
import type { TeamRole } from "@/types/auth";

const initialState: UserProfileState = {
  userID: "",
  teamID: "",
  teamRole: null,
  firstName: "",
  lastName: "",
  userEmail: "",
  profilePicture: "",
  isProfileComplete: false,
};

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    setUserID: (state, action: PayloadAction<string>) => {
      state.userID = action.payload;
    },
    setTeamID: (state, action: PayloadAction<string>) => {
      state.teamID = action.payload;
    },
    setTeamRole: (state, action: PayloadAction<TeamRole | null>) => {
      state.teamRole = action.payload;
    },
    setUserEmail: (state, action: PayloadAction<string>) => {
      state.userEmail = action.payload;
    },
    setFirstName: (state, action: PayloadAction<string>) => {
      state.firstName = action.payload;
    },
    setLastName: (state, action: PayloadAction<string>) => {
      state.lastName = action.payload;
    },
    setProfilePicture: (state, action: PayloadAction<string>) => {
      state.profilePicture = action.payload;
    },
    setIsProfileComplete: (state, action: PayloadAction<boolean>) => {
      state.isProfileComplete = action.payload;
    },
    resetUserProfile: (state) => {
      state.userID = "";
      state.teamID = "";
      state.teamRole = null;
      state.firstName = "";
      state.lastName = "";
      state.userEmail = "";
      state.profilePicture = "";
    },
  },
});

export const {
  setFirstName,
  setLastName,
  setProfilePicture,
  setIsProfileComplete,
  resetUserProfile,
  setUserID,
  setTeamID,
  setTeamRole,
  setUserEmail,
} = userProfileSlice.actions;

export const userProfileReducer = userProfileSlice.reducer;
