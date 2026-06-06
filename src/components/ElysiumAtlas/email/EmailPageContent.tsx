"use client";

import { useAppSelector } from "@/store";

interface EmailPageContentProps {
  children: React.ReactNode;
  className?: string;
}

export default function EmailPageContent({
  children,
  className = "",
}: EmailPageContentProps) {
  const isLeftNavOpen = useAppSelector(
    (state) => state.settings.isLeftNavOpen,
  );

  return (
    <div
      className={`w-full transition-all duration-300 mt-[65px] ${
        isLeftNavOpen ? "lg:pl-[280px]" : "lg:pl-20"
      } ${className}`}
    >
      <div className="w-full h-full">{children}</div>
    </div>
  );
}
