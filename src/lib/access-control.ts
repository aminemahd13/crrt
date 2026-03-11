export type UserRole = "admin" | "editor" | "member";

const ADMIN_ONLY_PAGE_PREFIXES = [
  "/admin/settings",
  "/admin/theme",
  "/admin/navigation",
  "/admin/email-templates",
] as const;

const ADMIN_ONLY_API_PREFIXES = [
  "/api/admin/settings",
  "/api/admin/theme",
  "/api/admin/navigation",
  "/api/admin/email",
  "/api/admin/email-templates",
] as const;

export function isUserRole(value: string | undefined | null): value is UserRole {
  return value === "admin" || value === "editor" || value === "member";
}

export function canAccessAdmin(role: string | undefined | null): boolean {
  return role === "admin" || role === "editor";
}

export function requiresAdminRole(pathname: string): boolean {
  return (
    ADMIN_ONLY_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    ADMIN_ONLY_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}
