import {
  EVENT_TYPES,
  isAbsoluteHttpUrl,
  isValidEventRegistrationMode,
  isValidEventThemePreset,
  isValidHexColor,
  isValidInternalOrExternalUrl,
} from "@/lib/event-config";

type EventType = (typeof EVENT_TYPES)[number];

export interface NormalizedEventPayload {
  title: string;
  slug: string;
  description: string;
  content: string;
  type: EventType;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  capacity: number | null;
  coverImage: string | null;
  published: boolean;
  themePreset: string;
  themeAccent: string | null;
  registrationMode: string;
  registrationLabel: string | null;
  registrationUrl: string | null;
  registrationReviewMode: string;
  publishStart: Date | null;
  publishEnd: Date | null;
}

export class EventPayloadValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super("Invalid event payload");
    this.issues = issues;
  }
}

function toObject(payload: unknown): Record<string, unknown> {
  if (typeof payload === "object" && payload !== null) {
    return payload as Record<string, unknown>;
  }
  return {};
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseRequiredString(value: unknown, field: string, issues: string[]): string {
  const parsed = parseOptionalString(value);
  if (!parsed) {
    issues.push(`${field} is required`);
    return "";
  }
  return parsed;
}

function parseDate(value: unknown, field: string, issues: string[], required = false): Date | null {
  if (value === null || value === undefined || value === "") {
    if (required) issues.push(`${field} is required`);
    return null;
  }
  const candidate = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(candidate.getTime())) {
    issues.push(`${field} must be a valid datetime`);
    return null;
  }
  return candidate;
}

function parseBoolean(value: unknown, defaultValue = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return defaultValue;
}

function parseOptionalInt(value: unknown, field: string, issues: string[]): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    issues.push(`${field} must be a positive integer`);
    return null;
  }
  return parsed;
}

function parseType(value: unknown): EventType {
  const candidate = typeof value === "string" ? value : "";
  if (EVENT_TYPES.includes(candidate as EventType)) {
    return candidate as EventType;
  }
  return "training";
}

export function normalizeEventPayload(payload: unknown): NormalizedEventPayload {
  const issues: string[] = [];
  const body = toObject(payload);

  const title = parseRequiredString(body.title, "title", issues);
  const rawSlug = parseOptionalString(body.slug) ?? slugify(title);
  const slug = rawSlug.toLowerCase();
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    issues.push("slug must contain only lowercase letters, numbers, and dashes");
  }

  const startDate = parseDate(body.startDate, "startDate", issues, true);
  const endDate = parseDate(body.endDate, "endDate", issues);
  if (startDate && endDate && endDate < startDate) {
    issues.push("endDate must be greater than or equal to startDate");
  }

  const publishStart = parseDate(body.publishStart, "publishStart", issues);
  const publishEnd = parseDate(body.publishEnd, "publishEnd", issues);
  if (publishStart && publishEnd && publishStart > publishEnd) {
    issues.push("publishStart must be less than or equal to publishEnd");
  }

  const themePresetRaw = (parseOptionalString(body.themePreset) ?? "default").toLowerCase();
  const themePreset = isValidEventThemePreset(themePresetRaw) ? themePresetRaw : null;
  if (!themePreset) {
    issues.push("themePreset is invalid");
  }

  const themeAccent = parseOptionalString(body.themeAccent);
  if (themeAccent && !isValidHexColor(themeAccent)) {
    issues.push("themeAccent must be a valid HEX color (example: #F97316)");
  }

  const registrationModeRaw = (parseOptionalString(body.registrationMode) ?? "internal").toLowerCase();
  const registrationMode = isValidEventRegistrationMode(registrationModeRaw)
    ? registrationModeRaw
    : null;
  if (!registrationMode) {
    issues.push("registrationMode is invalid");
  }

  const registrationLabel = parseOptionalString(body.registrationLabel);
  const registrationUrl = parseOptionalString(body.registrationUrl);
  if (registrationUrl && !isValidInternalOrExternalUrl(registrationUrl)) {
    issues.push("registrationUrl must be an absolute http(s) URL or start with '/'");
  }
  if (registrationMode === "external") {
    if (!registrationUrl) {
      issues.push("registrationUrl is required when registrationMode is external");
    } else if (!isAbsoluteHttpUrl(registrationUrl)) {
      issues.push("registrationUrl must be absolute http(s) URL when registrationMode is external");
    }
  }

  const capacity = parseOptionalInt(body.capacity, "capacity", issues);

  const registrationReviewModeRaw = (parseOptionalString(body.registrationReviewMode) ?? "auto").toLowerCase();
  const registrationReviewMode = ["auto", "manual"].includes(registrationReviewModeRaw)
    ? registrationReviewModeRaw
    : "auto";

  if (issues.length) {
    throw new EventPayloadValidationError(issues);
  }

  return {
    title,
    slug,
    description: parseOptionalString(body.description) ?? "",
    content: parseOptionalString(body.content) ?? "",
    type: parseType(body.type),
    startDate: startDate as Date,
    endDate,
    location: parseOptionalString(body.location),
    capacity,
    coverImage: parseOptionalString(body.coverImage),
    published: parseBoolean(body.published, false),
    themePreset: themePreset as string,
    themeAccent,
    registrationMode: registrationMode as string,
    registrationLabel,
    registrationUrl,
    registrationReviewMode,
    publishStart,
    publishEnd,
  };
}
