/** Terminal agent statuses — not building/indexing; no status polling needed. */
export const SETTLED_AGENT_STATUSES = [
  "active",
  "inactive",
  "failed",
  "disabled",
] as const;

export function isSettledAgentStatus(status: string): boolean {
  return SETTLED_AGENT_STATUSES.includes(
    status.toLowerCase() as (typeof SETTLED_AGENT_STATUSES)[number],
  );
}

export function isToggleableAgentStatus(status: string): boolean {
  const normalized = status.toLowerCase();
  return normalized === "active" || normalized === "disabled";
}

export function isAgentDisabled(status: string): boolean {
  return status.toLowerCase() === "disabled";
}

export const AGENT_OFFLINE_MESSAGE =
  "We're currently offline and can't respond to messages right now. Please check back later — we'll be happy to help when we're back online.";

export function getAgentStatusTextClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "disabled") return "text-danger-red";
  if (normalized === "active") return "text-serene-purple";
  return "text-teal-green";
}
