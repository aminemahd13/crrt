export type EncodedApplicationType = "registration" | "submission";

export interface DecodedApplicationId {
  type: EncodedApplicationType;
  id: string;
}

function sanitizeId(value: string): string {
  return value.trim();
}

export function encodeRegistrationApplicationId(registrationId: string): string {
  return `reg_${sanitizeId(registrationId)}`;
}

export function encodeSubmissionApplicationId(submissionId: string): string {
  return `sub_${sanitizeId(submissionId)}`;
}

export function decodeApplicationId(value: string): DecodedApplicationId | null {
  const normalized = sanitizeId(value);
  if (!normalized) return null;

  if (normalized.startsWith("reg_")) {
    const id = normalized.slice(4);
    return id ? { type: "registration", id } : null;
  }
  if (normalized.startsWith("sub_")) {
    const id = normalized.slice(4);
    return id ? { type: "submission", id } : null;
  }

  return null;
}
