"use client";
import React, { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setTheme } from "@/store/reducers/settingsSlice";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ThemeToggleProps {
  showIcon?: boolean;
}

export default function ThemeToggle({ showIcon = true }: ThemeToggleProps) {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state: any) => state.settings.theme);

  // Always call hooks before any conditional returns
  useEffect(() => {
    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [currentTheme]);

  // If showIcon is false, don't render anything
  if (!showIcon) {
    return null;
  }

  const toggleTheme = () => {
    dispatch(setTheme(currentTheme === "light" ? "dark" : "light"));
  };

  return (
    <>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger>
            <div
              className="cursor-pointer hover:bg-deep-onyx hover:text-white dark:text-white text-black p-[6px] rounded-[4px] transition-all duration-300"
              onClick={toggleTheme}
            >
              {currentTheme === "light" ? (
                <Moon size={16} />
              ) : (
                <Sun size={16} />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div
              className="flex items-center
             justify-center gap-[5px]"
            >
              <div>toggle theme</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
}
