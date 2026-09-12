export interface SettingsState {
  theme: "light" | "dark" | "system";
  isLeftNavOpen: boolean;
  appVersion: string;
  showSystemActivity: boolean;
}
