"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

export default function NProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Configure NProgress globally once on mount
  useEffect(() => {
    NProgress.configure({
      showSpinner: false,
      trickleSpeed: 200,
      minimum: 0.08,
      easing: "ease",
      speed: 500,
    });
  }, []);

  // Handle route changes
  useEffect(() => {
    // Finish progress when route changes
    NProgress.done();
  }, [pathname, searchParams]);

  return <>{children}</>;
}
