"use client";

import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/store";
import EmailUserAvatar from "@/components/ElysiumAtlas/email/EmailUserAvatar";
import EmailDropdown from "@/components/ElysiumAtlas/email/EmailDropdown";

export default function EmailTopNav() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isLeftNavOpen = useAppSelector((state) => state.settings.isLeftNavOpen);

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
    <div
      className={`fixed top-0 z-90 h-[65px] bg-white transition-all duration-300 w-full ${
        isLeftNavOpen
          ? "lg:left-[280px] lg:w-[calc(100%-280px)]"
          : "lg:left-20 lg:w-[calc(100%-5rem)]"
      }`}
    >
      <div className="flex items-center justify-end h-full px-6">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Account menu"
          >
            <EmailUserAvatar />
          </button>
          <EmailDropdown
            open={isDropdownOpen}
            onOpenChange={setIsDropdownOpen}
          />
        </div>
      </div>
    </div>
  );
}
