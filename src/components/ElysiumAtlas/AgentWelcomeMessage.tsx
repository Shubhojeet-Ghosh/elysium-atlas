"use client";

import AgentWelcomeMessageLeft from "./AgentWelcomeMessageLeft";
import AgentWelcomeMessageRight from "./AgentWelcomeMessageRight";

export default function AgentWelcomeMessage() {
  return (
    <div className="flex lg:flex-row flex-col w-full border-b border-border overflow-hidden">
      <AgentWelcomeMessageLeft />
      <AgentWelcomeMessageRight />
    </div>
  );
}
