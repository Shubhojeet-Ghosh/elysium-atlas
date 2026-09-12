import type {
  PluginParameterChip,
  PluginParametersSchema,
} from "@/types/plugins";

export function getPluginParameterChips(
  parameters?: PluginParametersSchema,
): PluginParameterChip[] {
  const properties = parameters?.properties ?? {};
  const required = new Set(parameters?.required ?? []);

  return Object.entries(properties).map(([name, def]) => {
    let type = "string";
    if (Array.isArray(def.enum)) {
      type = "enum";
    } else if (typeof def.type === "string" && def.type) {
      type = def.type;
    }
    return {
      name,
      type,
      required: required.has(name),
    };
  });
}
