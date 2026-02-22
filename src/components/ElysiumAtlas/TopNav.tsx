"use client";

import { useState, useEffect, useRef } from "react";
import { useAppDispatch } from "@/store";
import { setAppVersion } from "@/store/reducers/settingsSlice";
import packageJson from "../../../package.json";
import Dropdown from "@/components/ElysiumAtlas/Dropdown";
import UserAvatar from "@/components/ElysiumAtlas/UserAvatar";
import CompleteProfile from "@/components/ElysiumAtlas/CompleteProfile";
import { fetchUserPlan } from "@/utils/planApi";

export default function TopNav() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  // Update app version from package.json
  useEffect(() => {
    const version = packageJson.version;
    if (version) {
      dispatch(setAppVersion(version));
    }
  }, [dispatch]);

  // Fetch user plan info
  useEffect(() => {
    fetchUserPlan(dispatch);
  }, [dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <>
      <div className="fixed top-0 right-0 z-90 w-full">
        <div className=" flex  items-center justify-end w-auto h-[65px] bg-white dark:bg-[#0a0a0a] px-6 transition-all duration-300">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="User menu"
            >
              <UserAvatar />
            </button>
            <Dropdown open={isDropdownOpen} onOpenChange={setIsDropdownOpen} />
          </div>
        </div>
      </div>
      <CompleteProfile />
    </>
  );
}
