/**
 * LLM Model configuration
 */

export type LlmModelConfig = {
  model_code: string;
  model_icon: string;
  deprecated?: boolean;
};

export const AVAILABLE_MODELS: LlmModelConfig[] = [
  {
    model_code: "gpt-4o-mini",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/openai_icon.svg",
  },
  {
    model_code: "gpt-4.1-mini",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/openai_icon.svg",
  },
  {
    model_code: "gpt-5.4-mini",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/openai_icon.svg",
  },
  {
    model_code: "gpt-5-nano-2025-08-07",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/openai_icon.svg",
  },
  {
    model_code: "gpt-6-astra",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/openai_icon.svg",
  },
  {
    model_code: "gpt-6-sol",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/openai_icon.svg",
  },
  {
    model_code: "gpt-6-luna",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/openai_icon.svg",
  },
  {
    model_code: "gpt-5.6-sol",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/openai_icon.svg",
  },
  {
    model_code: "gpt-5.6-terra",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/openai_icon.svg",
  },
  {
    model_code: "gpt-5.6-luna",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/openai_icon.svg",
  },
  {
    model_code: "openai/gpt-oss-120b",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/openai_icon.svg",
  },
  {
    model_code: "openai/gpt-oss-20b",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/openai_icon.svg",
  },
  {
    model_code: "qwen/qwen3.8-27b",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/qwen_icon.svg",
  },
  {
    model_code: "claude-3-7-sonnet-latest",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/claude-icon.svg",
    deprecated: true,
  },
  {
    model_code: "claude-sonnet-4-0",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/claude-icon.svg",
    deprecated: true,
  },
  {
    model_code: "claude-sonnet-4-5",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/claude-icon.svg",
  },
  {
    model_code: "claude-haiku-4-5",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/claude-icon.svg",
  },
  {
    model_code: "claude-sonnet-5",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/claude-icon.svg",
  },
  {
    model_code: "grok-4-1-fast-non-reasoning",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/grok_icon.svg",
  },
  {
    model_code: "grok-4-1-fast-reasoning",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/grok_icon.svg",
  },
  {
    model_code: "grok-code-fast-1",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/grok_icon.svg",
  },
  {
    model_code: "deepseek-v4-flash",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/deepseek_icon.svg",
  },
  {
    model_code: "deepseek-v4-pro",
    model_icon:
      "https://cdn.sgdevstudio.in/assets/icons/llm_icons/deepseek_icon.svg",
  },
];

/** Models shown in create/update pickers. Deprecated models are hidden unless already selected. */
export function getSelectableModels(currentModel?: string): LlmModelConfig[] {
  return AVAILABLE_MODELS.filter(
    (model) => !model.deprecated || model.model_code === currentModel,
  );
}

/** Models supported for tool/plugin orchestration (`tool_calling_config.tool_calling_model`). */
export const TOOL_CALLING_MODEL_IDS = [
  "deepseek-v4-pro",
  "deepseek-v4-flash",
  "gpt-4o-mini",
  "gpt-4.1-mini",
  "gpt-5.4-mini",
  "gpt-5-nano-2025-08-07",
  "gpt-6-astra",
  "gpt-6-sol",
  "gpt-6-luna",
  "gpt-5.6-sol",
  "gpt-5.6-terra",
  "gpt-5.6-luna",
  "claude-sonnet-4-5",
  "claude-haiku-4-5",
  "claude-sonnet-5",
] as const;

export type ToolCallingModelId = (typeof TOOL_CALLING_MODEL_IDS)[number];

export const DEFAULT_TOOL_CALLING_MODEL: ToolCallingModelId = "deepseek-v4-pro";

const TOOL_CALLING_MODEL_LOOKUP = new Map(
  AVAILABLE_MODELS.map((model) => [model.model_code, model]),
);

/** Models shown in the tool/plugin orchestration picker. Deprecated models are hidden unless already selected. */
export function getSelectableToolCallingModels(
  currentModel?: string,
): LlmModelConfig[] {
  const models = TOOL_CALLING_MODEL_IDS.map(
    (modelCode) => TOOL_CALLING_MODEL_LOOKUP.get(modelCode)!,
  ).filter(
    (model) => !model.deprecated || model.model_code === currentModel,
  );

  if (
    currentModel &&
    !TOOL_CALLING_MODEL_IDS.includes(currentModel as ToolCallingModelId) &&
    TOOL_CALLING_MODEL_LOOKUP.has(currentModel)
  ) {
    models.push(TOOL_CALLING_MODEL_LOOKUP.get(currentModel)!);
  }

  return models;
}
