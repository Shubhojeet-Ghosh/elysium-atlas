"use client";

import { LogOut } from "lucide-react";
import Cookies from "js-cookie";
import NProgress from "nprogress";
import { useAppDispatch } from "@/store";
import { resetEmailUser } from "@/store/reducers/emailUserSlice";
import { resetEmailDepartments } from "@/store/reducers/emailDepartmentsSlice";

const EMAIL_SESSION_COOKIE = "email-session-token";

interface EmailLogoutProps {
  onClick?: () => void;
}

export default function EmailLogout({ onClick }: EmailLogoutProps) {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    onClick?.();
    NProgress.start();

    dispatch(resetEmailUser());
    dispatch(resetEmailDepartments());
    Cookies.remove(EMAIL_SESSION_COOKIE, { path: "/" });

    setTimeout(() => {
      NProgress.done();
      window.location.href = "/email/auth/login";
    }, 300);
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-between px-2 py-1.5 text-[13px] text-deep-onyx dark:text-pure-mist hover:text-pure-mist hover:bg-serene-purple rounded-sm transition-colors cursor-pointer"
    >
      <span>Logout</span>
      <LogOut className="h-4 w-4" />
    </button>
  );
}
