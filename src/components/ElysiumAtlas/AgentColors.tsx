"use client";

import AgentColorsLeft from "./AgentColorsLeft";
import AgentColorsRight from "./AgentColorsRight";

export default function AgentColors() {
  return (
    <div className="flex lg:flex-row flex-col w-full border-b border-border overflow-hidden">
      <AgentColorsLeft />
      <AgentColorsRight />
    </div>
  );
}
