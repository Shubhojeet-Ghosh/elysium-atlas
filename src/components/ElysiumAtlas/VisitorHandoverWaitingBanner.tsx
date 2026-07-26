"use client";

import type { VisitorHandoverState } from "@/types/humanHandover";
import { shouldShowHandoverWaitingBanner } from "@/utils/humanHandoverVisitorUtils";

interface VisitorHandoverWaitingBannerProps {
  handover: VisitorHandoverState;
  inConversationWith: string | null;
}

export default function VisitorHandoverWaitingBanner({
  handover,
  inConversationWith,
}: VisitorHandoverWaitingBannerProps) {
  if (!shouldShowHandoverWaitingBanner(handover, inConversationWith)) {
    return null;
  }

  return (
    <div
      className="sticky top-0 z-20 -mb-10 pointer-events-none border-b border-white/40 bg-white/25 px-4 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-150 [backdrop-filter:blur(20px)_saturate(150%)]"
      style={{ WebkitBackdropFilter: "blur(20px) saturate(150%)" }}
    >
      <p className="pointer-events-auto text-center text-[12px] font-semibold text-gray-800/90">
        Connecting you with a live agent.
      </p>
    </div>
  );
}
