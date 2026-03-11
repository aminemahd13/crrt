type JsonRecord = Record<string, unknown>;

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    const parsed = tryParseJson(value);
    if (Array.isArray(parsed)) return parsed as T[];
  }
  return [];
}

export function toStringArray(value: unknown): string[] {
  const arr = toArray<unknown>(value);
  return arr
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

export interface TrackMapItem {
  tag: string;
  label: string;
  icon: string;
}

export function toTrackMap(value: unknown): TrackMapItem[] {
  const arr = toArray<unknown>(value);
  return arr
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as JsonRecord;
      const tag = typeof row.tag === "string" ? row.tag : "";
      const label = typeof row.label === "string" ? row.label : "";
      const icon = typeof row.icon === "string" ? row.icon : "cpu";
      if (!tag || !label) return null;
      return { tag, label, icon };
    })
    .filter((item): item is TrackMapItem => item !== null);
}

export function toStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    if (typeof value === "string") {
      const parsed = tryParseJson(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed as JsonRecord).map(([key, val]) => [key, String(val ?? "")])
        );
      }
    }
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as JsonRecord).map(([key, val]) => [key, String(val ?? "")])
  );
}

export function toSelectOptions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const parsed = tryParseJson(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}
