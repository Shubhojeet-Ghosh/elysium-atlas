"use client";

import { User } from "lucide-react";
import { useAppSelector } from "@/store";

export default function UserAvatar() {
  const firstName = useAppSelector((state: any) => state.userProfile.firstName);
  const lastName = useAppSelector((state: any) => state.userProfile.lastName);

  // Generate user initials
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0).toUpperCase()}${lastName
        .charAt(0)
        .toUpperCase()}`;
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return null;
  };

  const userInitials = getInitials();
  const hasInitials = userInitials !== null;

  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-serene-purple dark:bg-serene-purple transition-all duration-200 cursor-pointer text-pure-mist">
      {hasInitials ? (
        <span className="text-[12px] font-semibold leading-none block text-center">
          {userInitials}
        </span>
      ) : (
        <User className="w-4 h-4 text-pure-mist shrink-0" />
      )}
    </div>
  );
}
