import type { HumanHandoverConfig } from "@/types/humanHandover";

export function extractHumanHandoverApiError(
  error: unknown,
  fallback: string,
): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function validateHumanHandoverForm(
  config: HumanHandoverConfig,
): string | null {
  if (!config.enable_human_handover) {
    return null;
  }

  const prompt = config.handover_trigger_prompt.trim();
  if (prompt.length < 10) {
    return "Please describe when your agent should offer a human handover (at least 10 characters).";
  }

  if (prompt.length > 500) {
    return "That description is too long — please keep it to 500 characters or fewer.";
  }

  return null;
}

export function configsAreEqual(
  a: HumanHandoverConfig,
  b: HumanHandoverConfig,
): boolean {
  return (
    a.enable_human_handover === b.enable_human_handover &&
    a.handover_trigger_prompt === b.handover_trigger_prompt
  );
}
