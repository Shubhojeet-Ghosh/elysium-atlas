"use client";

import { useAiSocket } from "@/hooks/useAiSocket";

/**
 * Mount once per page that needs the AI socket alive in the background.
 * The actual connection lifecycle is handled by `useAiSocket`.
 */
export default function AiSocketListener() {
  useAiSocket();
  return null;
}
