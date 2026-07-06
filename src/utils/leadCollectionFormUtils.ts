import { v4 as uuidv4 } from "uuid";
import type {
  LeadCollectionConfig,
  LeadCollectionFieldConfig,
  LeadCollectionFieldRow,
  LeadFieldCatalogItem,
  LeadFieldKey,
} from "@/types/leadCollection";

export function extractLeadCollectionApiError(
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

export function fieldsToRows(
  fields: LeadCollectionFieldConfig[],
): LeadCollectionFieldRow[] {
  return [...fields]
    .sort((a, b) => a.order - b.order)
    .map((field) => ({
      ...field,
      id: uuidv4(),
    }));
}

export function rowsToFields(
  rows: LeadCollectionFieldRow[],
): LeadCollectionFieldConfig[] {
  return rows.map((row, index) => ({
    key: row.key,
    required: row.required,
    order: index + 1,
  }));
}

export const DEFAULT_FIELD_KEYS: LeadFieldKey[] = ["email", "name", "phone"];

export function createDefaultFieldRows(
  catalog: LeadFieldCatalogItem[],
): LeadCollectionFieldRow[] {
  return DEFAULT_FIELD_KEYS.filter((key) =>
    catalog.some((item) => item.key === key),
  ).map((key, index) => ({
    id: uuidv4(),
    key,
    required: key === "email",
    order: index + 1,
  }));
}

export function getFieldDisplayLabel(
  row: LeadCollectionFieldRow,
  catalog: LeadFieldCatalogItem[],
): string {
  return row.customLabel ?? getCatalogLabel(catalog, row.key);
}

export function findCatalogItemByLabel(
  catalog: LeadFieldCatalogItem[],
  label: string,
  usedKeys: LeadFieldKey[],
): LeadFieldCatalogItem | undefined {
  const normalized = label.trim().toLowerCase();
  return catalog.find(
    (item) =>
      !usedKeys.includes(item.key) &&
      (item.label.toLowerCase() === normalized ||
        item.key.toLowerCase() === normalized),
  );
}

export function getNextUnusedCatalogKey(
  catalog: LeadFieldCatalogItem[],
  usedKeys: LeadFieldKey[],
): LeadFieldKey | null {
  const nextItem = catalog.find((item) => !usedKeys.includes(item.key));
  return nextItem?.key ?? null;
}

export function getCatalogLabel(
  catalog: LeadFieldCatalogItem[],
  key: LeadFieldKey,
): string {
  return catalog.find((item) => item.key === key)?.label ?? key;
}

export function validateLeadCollectionForm(
  config: LeadCollectionConfig,
): string | null {
  if (!config.enable_lead_capturing) {
    return null;
  }

  const prompt = config.collection_trigger_prompt.trim();
  if (prompt.length < 10) {
    return "Please describe when your agent should ask for contact details (at least 10 characters).";
  }

  if (prompt.length > 500) {
    return "That description is too long — please keep it to 500 characters or fewer.";
  }

  if (
    config.min_messages_before_ask < 1 ||
    config.min_messages_before_ask > 50
  ) {
    return "Please enter a number from 1 to 50 for how many visitor messages to wait for.";
  }

  if (config.fields.length === 0) {
    return "Add at least one field for your agent to collect when lead collection is on.";
  }

  const keys = config.fields.map((field) => field.key);
  if (new Set(keys).size !== keys.length) {
    return "Each field can only be added once.";
  }

  const orders = config.fields.map((field) => field.order);
  if (new Set(orders).size !== orders.length) {
    return "Each field needs a unique position in the list.";
  }

  return null;
}

export function configsAreEqual(
  a: LeadCollectionConfig,
  b: LeadCollectionConfig,
): boolean {
  return (
    a.enable_lead_capturing === b.enable_lead_capturing &&
    a.collection_trigger_prompt === b.collection_trigger_prompt &&
    a.min_messages_before_ask === b.min_messages_before_ask &&
    JSON.stringify(
      [...a.fields].sort((left, right) => left.order - right.order),
    ) ===
      JSON.stringify(
        [...b.fields].sort((left, right) => left.order - right.order),
      )
  );
}
