import type {
  ToolArrayItemType,
  ToolAuthResponse,
  ToolLeafParameterType,
  ToolNestedParameterInput,
  ToolNestedParameterRow,
  ToolParameterInput,
  ToolParameterRow,
  ToolParameterType,
  ToolParametersSchema,
  ToolScalarType,
} from "@/types/tools";

const TOOL_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export const PARAMETER_TYPE_OPTIONS: ToolParameterType[] = [
  "string",
  "number",
  "integer",
  "boolean",
  "enum",
  "array",
  "object",
];

export const NESTED_PARAMETER_TYPE_OPTIONS: ToolLeafParameterType[] = [
  "string",
  "number",
  "integer",
  "boolean",
  "enum",
  "array",
];

export const ARRAY_ITEM_TYPE_OPTIONS: ToolArrayItemType[] = [
  "string",
  "number",
  "integer",
  "boolean",
];

export function validateDisplayName(displayName: string): string | null {
  const trimmed = displayName.trim();
  if (!trimmed) return "Display name is required.";
  if (trimmed.length > 128) return "Display name must be 128 characters or fewer.";
  return null;
}

export function validateToolName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Tool name is required.";
  if (trimmed.length > 64) return "Tool name must be 64 characters or fewer.";
  if (!TOOL_NAME_PATTERN.test(trimmed)) {
    return "Use lowercase letters, numbers, and underscores. Must start with a letter.";
  }
  return null;
}

export function getAuthBadgeLabel(auth: ToolAuthResponse): string {
  if (auth.type === "none") return "No auth";
  if (auth.location === "query") return "API key (query)";
  return "API key (header)";
}

function schemaPropertyToNestedRow(
  name: string,
  def: Record<string, unknown>,
  required: Set<string>,
): ToolNestedParameterRow {
  if (def.type === "array") {
    const items = def.items as { type: ToolArrayItemType };
    return {
      id: crypto.randomUUID(),
      name,
      type: "array",
      description: String(def.description ?? ""),
      required: required.has(name),
      items_type: items?.type ?? "string",
    };
  }
  if (Array.isArray(def.enum)) {
    return {
      id: crypto.randomUUID(),
      name,
      type: "enum",
      description: String(def.description ?? ""),
      required: required.has(name),
      enum_values: def.enum as string[],
    };
  }
  return {
    id: crypto.randomUUID(),
    name,
    type: def.type as ToolScalarType,
    description: String(def.description ?? ""),
    required: required.has(name),
  };
}

export function schemaPropertyToRow(
  name: string,
  def: Record<string, unknown>,
  required: Set<string>,
): ToolParameterRow {
  if (def.type === "array") {
    const items = def.items as { type: ToolArrayItemType };
    return {
      id: crypto.randomUUID(),
      name,
      type: "array",
      description: String(def.description ?? ""),
      required: required.has(name),
      items_type: items?.type ?? "string",
    };
  }
  if (def.type === "object") {
    const nestedProps = (def.properties ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    const nestedRequired = new Set((def.required as string[]) ?? []);
    return {
      id: crypto.randomUUID(),
      name,
      type: "object",
      description: String(def.description ?? ""),
      required: required.has(name),
      properties: Object.entries(nestedProps).map(([nestedName, nestedDef]) =>
        schemaPropertyToNestedRow(nestedName, nestedDef, nestedRequired),
      ),
    };
  }
  if (Array.isArray(def.enum)) {
    return {
      id: crypto.randomUUID(),
      name,
      type: "enum",
      description: String(def.description ?? ""),
      required: required.has(name),
      enum_values: def.enum as string[],
    };
  }
  return {
    id: crypto.randomUUID(),
    name,
    type: def.type as ToolScalarType,
    description: String(def.description ?? ""),
    required: required.has(name),
  };
}

export function toolParametersToRows(
  parameters: ToolParametersSchema | undefined,
): ToolParameterRow[] {
  const props = parameters?.properties ?? {};
  const required = new Set(parameters?.required ?? []);
  return Object.entries(props).map(([name, def]) =>
    schemaPropertyToRow(name, def, required),
  );
}

function nestedRowToParameter(row: ToolNestedParameterRow): ToolNestedParameterInput {
  const base: ToolNestedParameterInput = {
    name: row.name.trim(),
    type: row.type,
    description: row.description.trim(),
    required: row.required,
  };
  if (row.type === "enum") {
    return {
      ...base,
      enum_values: (row.enum_values ?? []).map((v) => v.trim()).filter(Boolean),
    };
  }
  if (row.type === "array") {
    return { ...base, items_type: row.items_type ?? "string" };
  }
  return base;
}

export function rowToParameter(row: ToolParameterRow): ToolParameterInput {
  const base: ToolParameterInput = {
    name: row.name.trim(),
    type: row.type,
    description: row.description.trim(),
    required: row.required,
  };
  if (row.type === "enum") {
    return {
      ...base,
      enum_values: (row.enum_values ?? []).map((v) => v.trim()).filter(Boolean),
    };
  }
  if (row.type === "array") {
    return { ...base, items_type: row.items_type ?? "string" };
  }
  if (row.type === "object") {
    return {
      ...base,
      properties: (row.properties ?? []).map(nestedRowToParameter),
    };
  }
  return base;
}

export function rowsToToolParameters(
  rows: ToolParameterRow[],
): ToolParameterInput[] {
  return rows
    .filter((row) => row.name.trim() || row.description.trim())
    .map(rowToParameter);
}

function validateEnumValues(
  values: string[] | undefined,
  label: string,
): string | null {
  const trimmed = (values ?? []).map((v) => v.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    return `${label}: add at least one enum value.`;
  }
  if (new Set(trimmed).size !== trimmed.length) {
    return `${label}: enum values must be unique.`;
  }
  return null;
}

export function validateNestedParameterRows(
  rows: ToolNestedParameterRow[],
  context: string,
): string | null {
  const seenNames = new Set<string>();
  for (const row of rows) {
    if (!row.name.trim() && !row.description.trim()) continue;

    const nameError = validateToolName(row.name);
    if (nameError) return `${context} "${row.name || "unnamed"}": ${nameError}`;
    if (!row.description.trim()) {
      return `${context} "${row.name}" needs a description.`;
    }
    if (seenNames.has(row.name.trim())) {
      return `${context}: duplicate property name "${row.name}".`;
    }
    seenNames.add(row.name.trim());

    if (row.type === "enum") {
      const enumError = validateEnumValues(
        row.enum_values,
        `${context} "${row.name}"`,
      );
      if (enumError) return enumError;
    }
    if (row.type === "array" && !row.items_type) {
      return `${context} "${row.name}": select an array item type.`;
    }
  }
  return null;
}

export function validateParameterRows(rows: ToolParameterRow[]): string | null {
  const seenNames = new Set<string>();
  for (const row of rows) {
    if (!row.name.trim() && !row.description.trim()) continue;

    const nameError = validateToolName(row.name);
    if (nameError) return `Parameter "${row.name || "unnamed"}": ${nameError}`;
    if (!row.description.trim()) {
      return `Parameter "${row.name}" needs a description.`;
    }
    if (seenNames.has(row.name.trim())) {
      return `Duplicate parameter name "${row.name}".`;
    }
    seenNames.add(row.name.trim());

    if (row.type === "enum") {
      const enumError = validateEnumValues(row.enum_values, `Parameter "${row.name}"`);
      if (enumError) return enumError;
    }
    if (row.type === "array" && !row.items_type) {
      return `Parameter "${row.name}": select an array item type.`;
    }
    if (row.type === "object") {
      const nested = (row.properties ?? []).filter(
        (p) => p.name.trim() || p.description.trim(),
      );
      if (nested.length === 0) {
        return `Parameter "${row.name}": add at least one nested property.`;
      }
      const nestedError = validateNestedParameterRows(
        nested,
        `Parameter "${row.name}"`,
      );
      if (nestedError) return nestedError;
    }
  }
  return null;
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as {
    response?: {
      data?: {
        message?: string;
        detail?: string | Array<{ msg?: string }>;
      };
    };
    message?: string;
  };

  const detail = err.response?.data?.detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail[0]?.msg ?? fallback;
  }
  if (typeof detail === "string" && detail) return detail;

  return err.response?.data?.message || err.message || fallback;
}

export function createEmptyNestedParameterRow(): ToolNestedParameterRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "string",
    description: "",
    required: false,
  };
}

export function createEmptyParameterRow(): ToolParameterRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "string",
    description: "",
    required: false,
  };
}

export function normalizeRowForType(
  row: ToolParameterRow,
  type: ToolParameterType,
): ToolParameterRow {
  const base: ToolParameterRow = {
    ...row,
    type,
    enum_values: undefined,
    items_type: undefined,
    properties: undefined,
  };
  if (type === "enum") {
    return { ...base, enum_values: row.enum_values?.length ? row.enum_values : [""] };
  }
  if (type === "array") {
    return { ...base, items_type: row.items_type ?? "string" };
  }
  if (type === "object") {
    return {
      ...base,
      properties: row.properties?.length
        ? row.properties
        : [createEmptyNestedParameterRow()],
    };
  }
  return base;
}

export function normalizeNestedRowForType(
  row: ToolNestedParameterRow,
  type: ToolLeafParameterType,
): ToolNestedParameterRow {
  const base: ToolNestedParameterRow = {
    ...row,
    type,
    enum_values: undefined,
    items_type: undefined,
  };
  if (type === "enum") {
    return { ...base, enum_values: row.enum_values?.length ? row.enum_values : [""] };
  }
  if (type === "array") {
    return { ...base, items_type: row.items_type ?? "string" };
  }
  return base;
}
