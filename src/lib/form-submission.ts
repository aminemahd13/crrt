type JsonRecord = Record<string, unknown>;

export interface SubmissionFieldDescriptor {
  id: string;
  label: string;
  type: string;
  order: number;
}

export interface FileAnswerValue {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface SubmissionAnswer {
  type: string;
  value: string | FileAnswerValue;
}

export interface SubmissionDataV2 {
  schemaVersion: 2;
  answers: Record<string, SubmissionAnswer>;
  legacy: {
    unmapped: Record<string, string>;
  };
}

interface ParsedSubmissionData {
  schemaVersion: number;
  answers: Record<string, SubmissionAnswer>;
  legacyUnmapped: Record<string, string>;
  rawRecord: Record<string, string>;
}

function safeObject(value: unknown): JsonRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return {};
}

function toStringRecord(value: unknown): Record<string, string> {
  const record = safeObject(value);
  return Object.fromEntries(
    Object.entries(record).map(([key, val]) => [key, String(val ?? "")])
  );
}

function isFileAnswerValue(value: unknown): value is FileAnswerValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as JsonRecord;
  return (
    typeof item.url === "string" &&
    typeof item.filename === "string" &&
    typeof item.mimeType === "string" &&
    typeof item.size === "number"
  );
}

export function parseSubmissionData(data: unknown): ParsedSubmissionData {
  const root = safeObject(data);
  const schemaVersion =
    typeof root.schemaVersion === "number" ? Math.floor(root.schemaVersion) : 1;

  if (schemaVersion >= 2 && root.answers && typeof root.answers === "object") {
    const answerRecord = safeObject(root.answers);
    const answers: Record<string, SubmissionAnswer> = {};
    for (const [fieldId, rawAnswer] of Object.entries(answerRecord)) {
      const answerObj = safeObject(rawAnswer);
      const type = typeof answerObj.type === "string" ? answerObj.type : "text";
      const rawValue = answerObj.value;

      if (isFileAnswerValue(rawValue)) {
        answers[fieldId] = {
          type,
          value: {
            url: rawValue.url,
            filename: rawValue.filename,
            mimeType: rawValue.mimeType,
            size: rawValue.size,
          },
        };
      } else {
        answers[fieldId] = {
          type,
          value: String(rawValue ?? ""),
        };
      }
    }

    const legacy = safeObject(root.legacy);
    const legacyUnmapped = toStringRecord(legacy.unmapped);
    return {
      schemaVersion,
      answers,
      legacyUnmapped,
      rawRecord: {},
    };
  }

  return {
    schemaVersion: 1,
    answers: {},
    legacyUnmapped: {},
    rawRecord: toStringRecord(data),
  };
}

export function migrateLegacySubmissionData(
  rawData: unknown,
  fields: SubmissionFieldDescriptor[]
): SubmissionDataV2 {
  const parsed = parseSubmissionData(rawData);
  if (parsed.schemaVersion >= 2) {
    return {
      schemaVersion: 2,
      answers: parsed.answers,
      legacy: { unmapped: parsed.legacyUnmapped },
    };
  }

  const orderedFields = [...fields].sort((a, b) => a.order - b.order);
  const labelToFields = new Map<string, SubmissionFieldDescriptor[]>();
  for (const field of orderedFields) {
    const bucket = labelToFields.get(field.label) ?? [];
    bucket.push(field);
    labelToFields.set(field.label, bucket);
  }

  const answers: Record<string, SubmissionAnswer> = {};
  const legacyUnmapped: Record<string, string> = {};

  for (const [legacyKey, legacyValue] of Object.entries(parsed.rawRecord)) {
    const candidates = labelToFields.get(legacyKey) ?? [];
    if (candidates.length === 0) {
      legacyUnmapped[legacyKey] = legacyValue;
      continue;
    }

    const target = candidates[0];
    answers[target.id] = {
      type: target.type,
      value: legacyValue,
    };

    if (candidates.length > 1) {
      legacyUnmapped[legacyKey] = legacyValue;
    }
  }

  return {
    schemaVersion: 2,
    answers,
    legacy: {
      unmapped: legacyUnmapped,
    },
  };
}

export function toDisplayRecordFromSubmission(
  data: unknown,
  fields: SubmissionFieldDescriptor[]
): Record<string, string> {
  const parsed = parseSubmissionData(data);
  if (parsed.schemaVersion < 2) {
    return parsed.rawRecord;
  }

  const byId = new Map(fields.map((field) => [field.id, field]));
  const result: Record<string, string> = {};

  for (const [fieldId, answer] of Object.entries(parsed.answers)) {
    const descriptor = byId.get(fieldId);
    const label = descriptor?.label ?? fieldId;
    if (isFileAnswerValue(answer.value)) {
      result[label] = answer.value.filename || answer.value.url;
    } else {
      result[label] = String(answer.value ?? "");
    }
  }

  for (const [key, value] of Object.entries(parsed.legacyUnmapped)) {
    if (!(key in result)) {
      result[key] = value;
    }
  }

  return result;
}

export function updateSubmissionFromDisplayPatch(
  currentData: unknown,
  fields: SubmissionFieldDescriptor[],
  patch: Record<string, unknown>
): SubmissionDataV2 {
  const current = migrateLegacySubmissionData(currentData, fields);
  const labelToFields = new Map<string, SubmissionFieldDescriptor[]>();
  for (const field of [...fields].sort((a, b) => a.order - b.order)) {
    const bucket = labelToFields.get(field.label) ?? [];
    bucket.push(field);
    labelToFields.set(field.label, bucket);
  }

  for (const [label, value] of Object.entries(patch)) {
    const candidates = labelToFields.get(label) ?? [];
    if (candidates.length === 0) {
      throw new Error(`Invalid payload key: ${label}. Only existing keys can be updated.`);
    }
    const target = candidates[0];
    const existing = current.answers[target.id];
    const nextValue = String(value ?? "");

    if (existing && isFileAnswerValue(existing.value)) {
      // File answers are immutable via text payload editor.
      throw new Error(`Invalid payload key: ${label}. File fields cannot be edited here.`);
    }

    current.answers[target.id] = {
      type: target.type,
      value: nextValue,
    };
  }

  return current;
}
