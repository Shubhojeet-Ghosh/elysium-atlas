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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuWrapper,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppDispatch, useAppSelector } from "@/store";
import { setTheme } from "@/store/reducers/settingsSlice";
import Logout from "@/components/ElysiumAtlas/Logout";

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
        "(prefers-color-scheme: dark)"
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

  return (
    <DropdownMenuWrapper>
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuContent
          align="end"
          className="w-64 mt-1 bg-pure-mist dark:bg-deep-onyx border-gray-200 dark:border-serene-purple p-0"
        >
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-serene-purple">
            <div className="font-semibold text-deep-onyx dark:text-pure-mist text-[14px]">
              {userName}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-[12px] mt-0.5">
              {userEmail || "No email provided"}
            </div>
          </div>

          {/* Menu Items Section */}
          <div className="px-2 py-2">
            <DropdownMenuItem className="text-deep-onyx dark:text-pure-mist hover:bg-serene-purple dark:hover:bg-serene-purple hover:text-pure-mist">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-deep-onyx dark:text-pure-mist hover:text-pure-mist hover:bg-serene-purple dark:hover:bg-serene-purple ">
              <Settings className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
          </div>

          {/* Separator */}
          <div className="h-px bg-gray-200 dark:bg-serene-purple" />

          {/* Settings Section */}
          <div className="px-2 py-2">
            <div className="flex items-center justify-between px-2 py-1.5 text-[14px] text-deep-onyx dark:text-pure-mist  rounded-sm transition-colors">
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
        </DropdownMenuContent>
      </DropdownMenu>
    </DropdownMenuWrapper>
  );
}
