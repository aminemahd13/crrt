import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/lib/forms/auth-schemas";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "member@crrt.ma",
      password: "secret123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
    });

    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts matching password and confirmation", () => {
    const result = signupSchema.safeParse({
      name: "Member",
      email: "member@crrt.ma",
      password: "secret123",
      confirmPassword: "secret123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects when passwords do not match", () => {
    const result = signupSchema.safeParse({
      name: "Member",
      email: "member@crrt.ma",
      password: "secret123",
      confirmPassword: "secret456",
    });

    expect(result.success).toBe(false);
  });
});
