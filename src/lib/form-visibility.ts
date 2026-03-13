export type VisibilityOperator = "equals" | "contains" | "is_checked";

export interface VisibilityRule {
  sourceFieldId: string;
  operator: VisibilityOperator;
  value?: string;
}

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function isVisibilityRuleSatisfied(
  rule: VisibilityRule | null | undefined,
  answers: Record<string, unknown>
): boolean {
  if (!rule || !rule.sourceFieldId) return true;
  const raw = answers[rule.sourceFieldId];
  const sourceValue = normalize(raw);
  const expected = normalize(rule.value ?? "");

  if (rule.operator === "is_checked") {
    return sourceValue === "true" || sourceValue === "1" || sourceValue === "yes";
  }

  if (rule.operator === "contains") {
    return expected.length > 0 && sourceValue.includes(expected);
  }

  return sourceValue === expected;
}
