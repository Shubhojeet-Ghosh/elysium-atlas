export type EmailUserRole = "admin" | "member";

export const EMAIL_USER_ROLES: EmailUserRole[] = ["admin", "member"];

export function parseEmailUserRole(value: unknown): EmailUserRole | "" {
  if (value === "admin" || value === "member") {
    return value;
  }

  return "";
}

export interface EmailUserState {
  userID: string;
  name: string;
  email: string;
  teamID: string;
  departmentID: string;
  departmentName: string;
  role: EmailUserRole | "";
}