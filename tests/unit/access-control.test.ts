import { describe, expect, it } from "vitest";
import { canAccessAdmin, requiresAdminRole } from "@/lib/access-control";

describe("access control", () => {
  it("allows only admin/editor into admin area", () => {
    expect(canAccessAdmin("admin")).toBe(true);
    expect(canAccessAdmin("editor")).toBe(true);
    expect(canAccessAdmin("member")).toBe(false);
    expect(canAccessAdmin(undefined)).toBe(false);
  });

  it("flags admin-only paths", () => {
    expect(requiresAdminRole("/admin/settings")).toBe(true);
    expect(requiresAdminRole("/api/admin/email/test")).toBe(true);
    expect(requiresAdminRole("/admin/events")).toBe(false);
    expect(requiresAdminRole("/api/admin/projects")).toBe(false);
  });
});
