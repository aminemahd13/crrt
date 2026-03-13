import { Prisma } from "@prisma/client";
import { APPLICATION_MAX_UPLOAD_BYTES } from "@/lib/file-upload-policy";

export interface SectionInput {
  id?: string;
  title?: string;
  description?: string | null;
  order?: number;
  visibility?: unknown;
}

export interface FieldInput {
  id?: string;
  sectionId?: string;
  label?: string;
  type?: string;
  required?: boolean;
  placeholder?: string | null;
  options?: unknown;
  order?: number;
  visibility?: unknown;
  config?: unknown;
}

interface VisibilityRule {
  sourceFieldId: string;
  operator: "equals" | "contains" | "is_checked";
  value?: string;
}

export interface NormalizedSection {
  id?: string;
  title: string;
  description: string | null;
  order: number;
  visibility: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
}

export interface NormalizedField {
  id?: string;
  sectionId?: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string | null;
  options: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  order: number;
  visibility: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  config: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
}

function parseVisibilityRule(value: unknown): VisibilityRule | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const sourceFieldId = typeof (value as Record<string, unknown>).sourceFieldId === "string"
    ? String((value as Record<string, unknown>).sourceFieldId)
    : "";
  if (!sourceFieldId) return null;

  const operatorRaw = typeof (value as Record<string, unknown>).operator === "string"
    ? String((value as Record<string, unknown>).operator)
    : "equals";
  const operator = ["equals", "contains", "is_checked"].includes(operatorRaw)
    ? (operatorRaw as VisibilityRule["operator"])
    : "equals";

  return {
    sourceFieldId,
    operator,
    value:
      typeof (value as Record<string, unknown>).value === "string"
        ? String((value as Record<string, unknown>).value)
        : "",
  };
}

function normalizeFieldOptions(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return Prisma.JsonNull;
}

function normalizeFieldConfig(
  type: string,
  configValue: unknown
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  const config = configValue && typeof configValue === "object" && !Array.isArray(configValue)
    ? (configValue as Record<string, unknown>)
    : {};

  const helperText = typeof config.helperText === "string" ? config.helperText : "";

  if (type !== "file") {
    return helperText ? { helperText } : Prisma.JsonNull;
  }

  const file = config.file && typeof config.file === "object" && !Array.isArray(config.file)
    ? (config.file as Record<string, unknown>)
    : {};

  const accept = Array.isArray(file.accept)
    ? file.accept.map((item) => String(item).trim()).filter(Boolean)
    : [];

  const maxSizeBytes = typeof file.maxSizeBytes === "number" && Number.isFinite(file.maxSizeBytes)
    ? Math.max(1, Math.floor(file.maxSizeBytes))
    : APPLICATION_MAX_UPLOAD_BYTES;

  return {
    helperText,
    file: {
      accept,
      maxSizeBytes,
    },
  };
}

export function normalizeRegistrationSections(input: unknown): NormalizedSection[] {
  const sections = Array.isArray(input) ? input : [];
  return sections.map((item, index) => {
    const section = item as SectionInput;
    const parsedVisibility = parseVisibilityRule(section.visibility);
    return {
      id: typeof section.id === "string" && section.id.trim() ? section.id : undefined,
      title:
        typeof section.title === "string" && section.title.trim().length > 0
          ? section.title.trim()
          : `Section ${index + 1}`,
      description:
        typeof section.description === "string" && section.description.trim().length > 0
          ? section.description.trim()
          : null,
      order: typeof section.order === "number" ? section.order : index,
      visibility: parsedVisibility
        ? (parsedVisibility as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    };
  });
}

export function normalizeRegistrationFields(input: unknown): NormalizedField[] {
  const fields = Array.isArray(input) ? input : [];
  return fields.map((item, index) => {
    const field = item as FieldInput;
    const type = typeof field.type === "string" && field.type.trim().length > 0 ? field.type : "text";
    const parsedVisibility = parseVisibilityRule(field.visibility);
    return {
      id: typeof field.id === "string" && field.id.trim() ? field.id : undefined,
      sectionId:
        typeof field.sectionId === "string" && field.sectionId.trim().length > 0
          ? field.sectionId
          : undefined,
      label: typeof field.label === "string" ? field.label.trim() : "",
      type,
      required: field.required === true,
      placeholder:
        typeof field.placeholder === "string" && field.placeholder.trim().length > 0
          ? field.placeholder.trim()
          : null,
      options: normalizeFieldOptions(field.options),
      order: typeof field.order === "number" ? field.order : index,
      visibility: parsedVisibility
        ? (parsedVisibility as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      config: normalizeFieldConfig(type, field.config),
    };
  });
}
