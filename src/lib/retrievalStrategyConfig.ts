export const RETRIEVAL_STRATEGIES = [
  { value: "simple", label: "Direct" },
  { value: "orchestrated", label: "Orchestrated" },
] as const;

export function getRetrievalStrategyLabel(value: string) {
  return (
    RETRIEVAL_STRATEGIES.find((strategy) => strategy.value === value)?.label ??
    value
  );
}
