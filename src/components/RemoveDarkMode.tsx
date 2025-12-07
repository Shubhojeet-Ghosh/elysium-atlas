"use client";

import { useEffect } from "react";

export default function RemoveDarkMode() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return null;
}
