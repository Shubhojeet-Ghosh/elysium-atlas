"use client";
import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import Logo from "@/components/ElysiumAtlas/LogoComponent";
import ThemeToggle from "@/components/ElysiumAtlas/ThemeToggle";
import CompleteProfile from "@/components/ElysiumAtlas/CompleteProfile";

export default function LeftNav() {
  const [isOpen, setIsOpen] = useState(true);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const toggleNav = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative group z-20">
      <div
        className={`flex flex-col items-center justify-between h-dvh px-[18px] py-[10px] border-r-2 border-gray-300 dark:border-gray-300 hover:border-serene-purple dark:hover:border-serene-purple transition-all duration-300 ${
          isOpen
            ? "w-[220px] min-[1080px]:w-[220px]"
            : "w-[60px] overflow-hidden min-[1080px]:w-[220px] min-[1080px]:overflow-visible"
        } ${
          isButtonHovered
            ? "border-serene-purple dark:border-serene-purple"
            : ""
        }`}
      >
        <Logo showMiniature={!isOpen} />
      </div>
      <button
        onClick={toggleNav}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        className="text-serene-purple absolute top-[50px] -right-[13px] z-10 rounded-full bg-pure-mist dark:bg-deep-onyx border-2 border-serene-purple p-1 opacity-100 min-[1080px]:opacity-0 min-[1080px]:group-hover:opacity-100 transition-all duration-200 cursor-pointer hover:bg-serene-purple hover:text-white dark:hover:bg-serene-purple dark:hover:text-white"
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4 " />
        ) : (
          <ChevronRight className="w-4 h-4 " />
        )}
      </button>
      <ThemeToggle showIcon={false} />
      <CompleteProfile />
    </div>
  );
}
