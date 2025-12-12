"use client";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContent({
  children,
  className = "",
}: PageContentProps) {
  const isLeftNavOpen = useSelector(
    (state: RootState) => state.settings.isLeftNavOpen
  );

  return (
    <div
      className={`
        w-full
        transition-all duration-300
        mt-[65px]
        ${isLeftNavOpen ? "lg:pl-[280px]" : "lg:pl-20"}
        ${className}
      `}
    >
      <div className="w-full h-full">{children}</div>
    </div>
  );
}
