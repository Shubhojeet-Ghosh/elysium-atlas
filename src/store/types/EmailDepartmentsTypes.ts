export interface EmailDepartment {
  department_id: string;
  team_id: string;
  department_name: string;
  department_description: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmailDepartmentsState {
  teamID: string;
  departments: EmailDepartment[];
  isLoaded: boolean;
}

export interface ListTeamDepartmentsResponse {
  success: boolean;
  message?: string;
  team_id?: string;
  count?: number;
  departments?: EmailDepartment[];
}
