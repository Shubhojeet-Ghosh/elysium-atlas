import type {
  SessionLeadCollection,
  SessionLeadCollectionField,
  SessionLeadListStatus,
} from "@/types/leadCollection";

/** True when the socket/API row included a `lead_collection` key (value may be null). */
export function sessionRowHasLeadCollection(
  row?: { lead_collection?: SessionLeadCollection | null } | null,
): boolean {
  return row != null && row.lead_collection !== undefined;
}

export function deriveSessionLeadListStatus(
  leadCollection?: SessionLeadCollection | null,
): SessionLeadListStatus {
  const fields = leadCollection?.fields ?? [];
  if (fields.length === 0) return null;

  const hasValue = (value: string | null | undefined) =>
    Boolean((value ?? "").trim());

  const hasAnyValue = fields.some((field) => hasValue(field.value));
  if (!hasAnyValue) return null;

  const requiredFields = fields.filter((field) => field.required);
  const allRequiredFilled =
    requiredFields.length > 0
      ? requiredFields.every((field) => hasValue(field.value))
      : fields.every((field) => hasValue(field.value));

  return allRequiredFilled ? "complete" : "partial";
}

export function mergeSessionLeadFieldValues(
  leadCollection: SessionLeadCollection,
  values: Record<string, string>,
): SessionLeadCollection {
  return {
    ...leadCollection,
    fields: leadCollection.fields.map((field) => {
      const nextValue =
        field.key in values ? values[field.key]?.trim() || null : field.value;
      return {
        ...field,
        value: nextValue,
        captured: Boolean((nextValue ?? "").trim()),
      };
    }),
  };
}

export function withDerivedSessionLeadStatus(
  leadCollection: SessionLeadCollection,
): SessionLeadCollection {
  const list_status = deriveSessionLeadListStatus(leadCollection);
  return {
    ...leadCollection,
    list_status,
    status:
      list_status === "complete"
        ? "complete"
        : list_status === "partial"
          ? "partial"
          : leadCollection.status,
  };
}

export function getSessionLeadListStatus(
  leadCollection?: SessionLeadCollection | null,
  legacyLeadStatus?: SessionLeadListStatus,
): SessionLeadListStatus {
  const derived = deriveSessionLeadListStatus(leadCollection);
  const serverStatus = leadCollection?.list_status ?? legacyLeadStatus ?? null;

  if (serverStatus === "complete" || derived === "complete") {
    return "complete";
  }
  if (serverStatus === "partial" || derived === "partial") {
    return "partial";
  }
  return null;
}

export function shouldShowSessionLeadBanner(
  leadCollection?: SessionLeadCollection | null,
  legacyLeadStatus?: SessionLeadListStatus,
): boolean {
  const status = getSessionLeadListStatus(leadCollection, legacyLeadStatus);
  return status === "partial" || status === "complete";
}

export function getCapturedLeadFields(
  leadCollection?: SessionLeadCollection | null,
): SessionLeadCollectionField[] {
  return [...(leadCollection?.fields ?? [])]
    .filter((field) => Boolean((field.value ?? "").trim()))
    .sort((left, right) => left.order - right.order);
}

export function sessionLeadFieldValues(
  leadCollection?: SessionLeadCollection | null,
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of leadCollection?.fields ?? []) {
    values[field.key] = field.value ?? "";
  }
  return values;
}

export function sessionLeadValuesEqual(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] ?? "") !== (b[key] ?? "")) {
      return false;
    }
  }
  return true;
}

export function buildSessionLeadPatch(
  initial: Record<string, string>,
  current: Record<string, string>,
): Record<string, string | null> {
  const patch: Record<string, string | null> = {};
  const keys = new Set([...Object.keys(initial), ...Object.keys(current)]);

  for (const key of keys) {
    const before = initial[key] ?? "";
    const after = current[key] ?? "";
    if (before !== after) {
      patch[key] = after.trim() === "" ? null : after.trim();
    }
  }

  return patch;
}

export function leadCollectionListStatusChanged(
  existing?: SessionLeadCollection | null,
  incoming?: SessionLeadCollection | null,
): boolean {
  if (!existing && !incoming) return false;
  if (!existing || !incoming) return true;
  if (existing.list_status !== incoming.list_status) return true;

  const existingFields = existing.fields ?? [];
  const incomingFields = incoming.fields ?? [];
  if (existingFields.length !== incomingFields.length) return true;

  return existingFields.some((field, index) => {
    const next = incomingFields[index];
    return (
      field.key !== next?.key ||
      (field.value ?? "") !== (next?.value ?? "") ||
      field.captured !== next?.captured
    );
  });
}
