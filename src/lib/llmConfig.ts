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
    model_code: "gpt-5-nano-2025-08-07",
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
