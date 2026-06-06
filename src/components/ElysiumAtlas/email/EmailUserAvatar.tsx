"use client";

import { User } from "lucide-react";
import { useAppSelector } from "@/store";

export default function EmailUserAvatar() {
  const name = useAppSelector((state) => state.emailUser.name);

  const getInitials = () => {
    if (!name?.trim()) return null;
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  };

  const userInitials = getInitials();

  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-serene-purple transition-all duration-200 cursor-pointer text-pure-mist">
      {userInitials ? (
        <span className="text-[12px] font-semibold leading-none block text-center">
          {userInitials}
        </span>
      ) : (
        <User className="w-4 h-4 text-pure-mist shrink-0" />
      )}
    </div>
  );
}
