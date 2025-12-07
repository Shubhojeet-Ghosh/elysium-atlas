"use client";

import { useState, useEffect, useRef } from "react";
import Dropdown from "@/components/ElysiumAtlas/Dropdown";
import UserAvatar from "@/components/ElysiumAtlas/UserAvatar";

export default function TopNav() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <div className="flex items-center justify-end w-full h-16 px-6 border-b border-gray-200 dark:border-gray-200 transition-all duration-300 bg-pure-mist dark:bg-deep-onyx">
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
  );
}
