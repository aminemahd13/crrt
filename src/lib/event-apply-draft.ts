export interface EventApplyFieldDescriptor {
  id: string;
  label: string;
  required: boolean;
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

export function clearEventApplyDraft(storage: BrowserStorageLike, key: string) {
  storage.removeItem(key);
}

export function validateApplyRequiredFields(
  fields: EventApplyFieldDescriptor[],
  values: Record<string, string>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (!field.required) continue;
    const value = values[field.label];
    if (typeof value !== "string" || value.trim().length === 0) {
      errors[field.label] = `${field.label} is required`;
    }
  }
  return errors;
}
