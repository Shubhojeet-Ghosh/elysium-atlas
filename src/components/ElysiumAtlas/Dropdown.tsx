"use client";

import {
  LayoutDashboard,
  Settings,
  Users,
  Command,
  Monitor,
  Sun,
  Moon,
  Home,
  LogOut,
  Plus,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppDispatch, useAppSelector } from "@/store";
import { setTheme } from "@/store/reducers/settingsSlice";
import Logout from "@/components/ElysiumAtlas/Logout";
import PlanBadge from "@/components/ElysiumAtlas/PlanBadge";
import Link from "next/link";
import type { TeamRole, UserTeam } from "@/types/auth";
import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";

function formatTeamRoleLabel(role: TeamRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
interface DropdownProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function Dropdown({ open, onOpenChange }: DropdownProps) {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state: any) => state.settings.theme);
  const firstName = useAppSelector((state: any) => state.userProfile.firstName);
  const lastName = useAppSelector((state: any) => state.userProfile.lastName);
  const userEmail = useAppSelector((state: any) => state.userProfile.userEmail);
  const teamID = useAppSelector((state: any) => state.userProfile.teamID);
  const teams = useAppSelector((state: any) => state.teams.list);
  const activeTeamRole = useActiveTeamRole();

  const activeTeam = teams.find((team: UserTeam) => team.team_id === teamID);
  const activeTeamName = activeTeam?.team_name?.trim() || null;
  const displayRole =
    activeTeamRole ?? activeTeam?.role ?? null;

  // Generate username for display
  const userName =
    firstName && lastName
      ? `${firstName}-${lastName}`.toLowerCase()
      : firstName
        ? firstName.toLowerCase()
        : "unnamed user";

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    dispatch(setTheme(theme));
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System theme - use system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // Detect if user is on Mac for tooltip text
  const isMac =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const shortcutKey = isMac ? "Cmd" : "Ctrl";

  if (!open) return null;

  return (
    <div className="absolute right-0 top-full mt-1 w-64 max-w-[calc(100vw-1.5rem)] overflow-hidden bg-pure-mist dark:bg-deep-onyx border border-gray-200 dark:border-serene-purple rounded-md shadow-lg z-50">
      {/* User Info Section */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-serene-purple min-w-0 overflow-hidden">
        <div className="font-semibold text-deep-onyx dark:text-pure-mist text-[14px] truncate">
          {userName}
        </div>
        <div className="text-gray-600 dark:text-gray-400 text-[12px] mt-0.5 truncate">
          {userEmail || "No email provided"}
        </div>
        {activeTeamName ? (
          <div className="flex items-center gap-2 mt-0.5 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="min-w-0 flex-1 truncate text-gray-500 dark:text-gray-400 text-[12px]">
                  {activeTeamName}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs break-all">
                {activeTeamName}
              </TooltipContent>
            </Tooltip>
            {displayRole ? (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium leading-none ${
                  displayRole === "owner" || displayRole === "admin"
                    ? "bg-serene-purple/10 text-serene-purple dark:bg-serene-purple/25 dark:text-pure-mist"
                    : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                }`}
              >
                {formatTeamRoleLabel(displayRole)}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Menu Items Section */}
      <div className="px-2 py-2 text-[13px]">
        <Link href="/my-agents">
          <div className="flex items-center px-2 py-1.5 text-deep-onyx dark:text-pure-mist hover:bg-serene-purple dark:hover:bg-serene-purple hover:text-pure-mist rounded-sm cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </div>
        </Link>
        {displayRole === "owner" ? (
          <Link
            href="/account-settings"
            onClick={() => onOpenChange?.(false)}
          >
            <div className="flex items-center px-2 py-1.5 text-deep-onyx dark:text-pure-mist hover:bg-serene-purple dark:hover:bg-serene-purple hover:text-pure-mist rounded-sm cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </div>
          </Link>
        ) : null}
        <PlanBadge />
      </div>

      {/* Separator */}
      <div className="h-px bg-gray-200 dark:bg-serene-purple" />

      {/* Settings Section */}
      <div className="px-2 py-2">
        <div className="flex items-center justify-between px-2 py-1.5 text-[13px] text-deep-onyx dark:text-pure-mist rounded-sm transition-colors">
          <span>Theme</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleThemeChange("light");
                  }}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    currentTheme === "light"
                      ? "bg-serene-purple text-pure-mist hover:text-deep-onyx hover:bg-pure-mist"
                      : "hover:bg-pure-mist hover:text-deep-onyx"
                  }`}
                  aria-label="Light theme"
                >
                  <Sun className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle using {shortcutKey} + D</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleThemeChange("dark");
                  }}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    currentTheme === "dark"
                      ? "bg-gray-200 dark:bg-serene-purple dark:hover:bg-pure-mist hover:text-deep-onyx"
                      : "hover:bg-pure-mist hover:text-deep-onyx"
                  }`}
                  aria-label="Dark theme"
                >
                  <Moon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle using {shortcutKey} + D</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-gray-200 dark:bg-serene-purple" />

      {/* Navigation Section */}
      <div className="px-2 py-2">
        <Logout />
      </div>
    </div>
  );
}
