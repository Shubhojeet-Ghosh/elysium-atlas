"use client";
import React from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ElysiumAtlas/ThemeToggle";
import Logo from "@/components/ElysiumAtlas/LogoComponent";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-background text-foreground transition-colors duration-300 relative">
      {/* Logo at top left */}
      <div className="absolute top-6 left-6">
        <Logo />
      </div>

      {/* Centered content */}
      <div className="flex items-center justify-center min-h-dvh px-4">
        <div className="text-center space-y-8 max-w-2xl">
          {/* 404 Number */}
          <div className="relative">
            <h1
              className="text-9xl md:text-[12rem] font-bold font-mono select-none"
              style={{ color: "#6c5f8d" }}
            >
              404
            </h1>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
              Page Not Found
            </h2>

            {/* Link */}
            <div className="flex justify-center items-center pt-4">
              <Link
                href="/"
                className="text-foreground hover:text-primary transition-colors duration-200 underline"
              >
                back to homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
      <ThemeToggle showIcon={false} />
    </div>
  );
}
