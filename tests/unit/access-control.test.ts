import { describe, expect, it } from "vitest";
import { canAccessAdmin } from "@/lib/access-control";

describe("access control", () => {
  it("allows only admin into admin area", () => {
    expect(canAccessAdmin("admin")).toBe(true);
    expect(canAccessAdmin("member")).toBe(false);
    expect(canAccessAdmin("editor")).toBe(false);
    expect(canAccessAdmin(undefined)).toBe(false);
  });
});
