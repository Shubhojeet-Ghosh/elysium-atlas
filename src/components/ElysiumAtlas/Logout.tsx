"use client";

import { useEffect } from "react";
import { LogOut } from "lucide-react";
import Cookies from "js-cookie";
import NProgress from "nprogress";
import { useAppDispatch } from "@/store";
import { resetAgentBuilder } from "@/store/reducers/agentBuilderSlice";
import { resetUserProfile } from "@/store/reducers/userProfileSlice";

interface LogoutProps {
  onClick?: () => void;
}

export default function Logout({ onClick }: LogoutProps) {
  const dispatch = useAppDispatch();

  // Configure nprogress on mount
  useEffect(() => {
    NProgress.configure({
      showSpinner: false,
      trickleSpeed: 200,
    });
  }, []);

  const handleLogout = () => {
    // Start progress bar
    NProgress.start();

    // Reset all Redux state
    dispatch(resetAgentBuilder());
    dispatch(resetUserProfile());

    // Clear the session token cookie
    Cookies.remove("elysium_atlas_session_token");

    // Small delay to show progress, then redirect
    setTimeout(() => {
      NProgress.done();
      // Redirect to login page
      window.location.href = "/auth/login";
    }, 300);
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-between px-2 py-1.5 text-[14px] text-deep-onyx dark:text-pure-mist hover:text-pure-mist hover:bg-serene-purple rounded-sm transition-colors cursor-pointer"
    >
      <span>Log Out</span>
      <LogOut className="h-4 w-4" />
    </button>
  );
}
