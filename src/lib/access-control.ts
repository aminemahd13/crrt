export type UserRole = "admin" | "member";

export function isUserRole(value: string | undefined | null): value is UserRole {
  return value === "admin" || value === "member";
}

export function canAccessAdmin(role: string | undefined | null): boolean {
  return role === "admin";
}
