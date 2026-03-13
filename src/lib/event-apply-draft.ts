export interface EventApplyFieldDescriptor {
  id: string;
  label: string;
  required: boolean;
}

export interface EventApplyDraftFileValue {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface EventApplyStructuredDraft {
  values: Record<string, string>;
  files: Record<string, EventApplyDraftFileValue>;
}

export interface BrowserStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function buildFieldSignature(fields: EventApplyFieldDescriptor[]): string {
  return fields
    .map((field) => `${field.id}:${field.label}:${field.required ? "1" : "0"}`)
    .join("|");
}

export function createEventApplyDraftKey(
  eventId: string,
  userId: string,
  fields: EventApplyFieldDescriptor[]
): string {
  const signature = hashString(buildFieldSignature(fields));
  return `event-apply-draft:${eventId}:${userId}:${signature}`;
}

export function saveEventApplyDraft(
  storage: BrowserStorageLike,
  key: string,
  values: Record<string, string>
) {
  storage.setItem(key, JSON.stringify(values));
}

function isDraftFileValue(value: unknown): value is EventApplyDraftFileValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.url === "string" &&
    typeof entry.filename === "string" &&
    typeof entry.mimeType === "string" &&
    typeof entry.size === "number" &&
    Number.isFinite(entry.size)
  );
}

export function loadEventApplyDraft(
  storage: BrowserStorageLike,
  key: string
): Record<string, string> | null {
  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const normalized: Record<string, string> = {};
    for (const [field, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        normalized[field] = value;
      }
    }
    return normalized;
  } catch {
    return null;
  }
}

export function saveEventApplyStructuredDraft(
  storage: BrowserStorageLike,
  key: string,
  draft: EventApplyStructuredDraft
) {
  storage.setItem(key, JSON.stringify(draft));
}

export function loadEventApplyStructuredDraft(
  storage: BrowserStorageLike,
  key: string
): EventApplyStructuredDraft | null {
  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const payload = parsed as Record<string, unknown>;
    const legacyRecord = loadEventApplyDraft(storage, key);
    if (!("values" in payload)) {
      return {
        values: legacyRecord ?? {},
        files: {},
      };
    }

    const valuesRecord =
      payload.values && typeof payload.values === "object" && !Array.isArray(payload.values)
        ? (payload.values as Record<string, unknown>)
        : {};
    const filesRecord =
      payload.files && typeof payload.files === "object" && !Array.isArray(payload.files)
        ? (payload.files as Record<string, unknown>)
        : {};

    const values: Record<string, string> = {};
    for (const [field, value] of Object.entries(valuesRecord)) {
      if (typeof value === "string") {
        values[field] = value;
      }
    }

    const files: Record<string, EventApplyDraftFileValue> = {};
    for (const [field, value] of Object.entries(filesRecord)) {
      if (isDraftFileValue(value)) {
        files[field] = value;
      }
    }

    return { values, files };
  } catch {
    return null;
  }
}

export function clearEventApplyDraft(storage: BrowserStorageLike, key: string) {
  storage.removeItem(key);
}

export function validateApplyRequiredFields(
  fields: EventApplyFieldDescriptor[],
  values: Record<string, string>,
  files: Record<string, EventApplyDraftFileValue> = {}
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (!field.required) continue;
    const value = values[field.id] ?? values[field.label];
    if (typeof value === "string" && value.trim().length > 0) {
      continue;
    }
    if (files[field.id]) {
      continue;
    }
    if (typeof value !== "string" || value.trim().length === 0) {
      errors[field.label] = `${field.label} is required`;
    }
  }
  return errors;
}
