import type { TeamRole } from "@/types/auth";

export interface UserProfileState {
  userID: string;
  teamID: string;
  teamRole: TeamRole | null;
  userEmail: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  isProfileComplete: boolean;
}
