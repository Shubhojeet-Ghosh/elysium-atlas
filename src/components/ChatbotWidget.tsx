"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

interface ChatbotWidgetProps {
  agentId: string;
}

export default function ChatbotWidget({ agentId }: ChatbotWidgetProps) {
  const [shouldLoad, setShouldLoad] = useState(true);

  useEffect(() => {
    // Cleanup function - removes widget when component unmounts
    return () => {
      setShouldLoad(false);

      // Remove any widget elements the script may have injected
      const widgetElements = document.querySelectorAll(
        '[id*="sg-widget"], [id*="sgdevstudio"], [class*="sg-widget"], [class*="sgdevstudio"], iframe[src*="sgdevstudio"]'
      );
      widgetElements.forEach((el) => el.remove());

      // Also try to remove by common chat widget container patterns
      const chatContainers = document.querySelectorAll(
        '[id*="chat-widget"], [id*="chatbot"], [class*="chat-widget"], [class*="chatbot-container"]'
      );
      chatContainers.forEach((el) => el.remove());
    };
  }, []);

  if (!shouldLoad) return null;

  return (
    <Script
      src={`https://cdn.sgdevstudio.in/widget/v0.0.4/widget.js?agent_id=${agentId}`}
      strategy="afterInteractive"
    />
  );
}
