"use client";

import { useEffect, useState } from "react";
import type { CapturedSessionMode } from "@/store/reducers/agentSlice";
import type {
  SessionLeadCollection,
  SessionLeadListStatus,
} from "@/types/leadCollection";
import ConversationMonitorBanner from "@/components/ElysiumAtlas/ConversationMonitorBanner";
import ConversationLeadBanner from "@/components/ElysiumAtlas/ConversationLeadBanner";
import {
  getSessionLeadListStatus,
  shouldShowSessionLeadBanner,
} from "@/utils/leadCollectionSessionUtils";
import { conversationBannerHeightClass } from "@/components/ElysiumAtlas/conversationBannerStyles";

const BANNER_ROTATE_MS = 2500;
const BANNER_TRANSITION_MS = 500;

type ConversationChatBannersProps = {
  visible: boolean;
  conversationMode: CapturedSessionMode;
  isPeerTakeover: boolean;
  handlerName?: string | null;
  leadCollection?: SessionLeadCollection | null;
  legacyLeadStatus?: SessionLeadListStatus;
  onTakeOver: () => void;
  isTakeoverPending?: boolean;
  canTakeOver?: boolean;
  onOpenLeadDetails: () => void;
};

export default function ConversationChatBanners({
  visible,
  conversationMode,
  isPeerTakeover,
  handlerName,
  leadCollection,
  legacyLeadStatus,
  onTakeOver,
  isTakeoverPending = false,
  canTakeOver = true,
  onOpenLeadDetails,
}: ConversationChatBannersProps) {
  const leadListStatus = getSessionLeadListStatus(
    leadCollection,
    legacyLeadStatus,
  );
  const showLeadBanner = shouldShowSessionLeadBanner(
    leadCollection,
    legacyLeadStatus,
  );
  const showMonitorBanner = visible && conversationMode === "monitor";
  const shouldRotate = showMonitorBanner && showLeadBanner;
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  const monitorBannerProps = {
    variant: (isPeerTakeover ? "peer" : "self") as "peer" | "self",
    handlerName,
    onTakeOver,
    isTakeoverPending,
    canTakeOver,
  };

  useEffect(() => {
    if (!shouldRotate) {
      setActiveIndex(0);
      setTransitionEnabled(true);
      return;
    }

    const interval = window.setInterval(() => {
      setTransitionEnabled(true);
      setActiveIndex((current) => current + 1);
    }, BANNER_ROTATE_MS);

    return () => window.clearInterval(interval);
  }, [shouldRotate]);

  // Loop back to the first slide without a reverse (left-to-right) animation.
  useEffect(() => {
    if (!shouldRotate || activeIndex !== 2) return;

    const timeout = window.setTimeout(() => {
      setTransitionEnabled(false);
      setActiveIndex(0);
    }, BANNER_TRANSITION_MS);

    return () => window.clearTimeout(timeout);
  }, [activeIndex, shouldRotate]);

  useEffect(() => {
    if (transitionEnabled || activeIndex !== 0) return;

    const frame = window.requestAnimationFrame(() => {
      setTransitionEnabled(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, transitionEnabled]);

  if (!visible) return null;

  if (
    conversationMode === "takeover" &&
    showLeadBanner &&
    leadListStatus &&
    leadCollection
  ) {
    return (
      <ConversationLeadBanner
        leadCollection={leadCollection}
        listStatus={leadListStatus}
        onOpenDetails={onOpenLeadDetails}
      />
    );
  }

  if (showMonitorBanner && showLeadBanner && leadListStatus && leadCollection) {
    return (
      <div className={`overflow-hidden shrink-0 ${conversationBannerHeightClass}`}>
        <div
          className={`flex h-full ${
            transitionEnabled
              ? "transition-transform duration-500 ease-in-out"
              : ""
          }`}
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          <div className="flex h-full min-w-full w-full shrink-0">
            <ConversationMonitorBanner {...monitorBannerProps} />
          </div>
          <div className="flex h-full min-w-full w-full shrink-0">
            <ConversationLeadBanner
              leadCollection={leadCollection}
              listStatus={leadListStatus}
              onOpenDetails={onOpenLeadDetails}
            />
          </div>
          <div className="flex h-full min-w-full w-full shrink-0">
            <ConversationMonitorBanner {...monitorBannerProps} />
          </div>
        </div>
      </div>
    );
  }

  if (showMonitorBanner) {
    return (
      <ConversationMonitorBanner {...monitorBannerProps} />
    );
  }

  return null;
}
