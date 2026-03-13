import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

const accountActionsMock = {
  ACCOUNT_ACTION: {
    EMAIL_VERIFY: "email_verify",
  },
  issueAccountActionToken: vi.fn(),
  sendEmailVerificationEmail: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/lib/metrics", () => ({
  recordApiRequest: vi.fn(),
  recordApiError: vi.fn(),
}));

vi.mock("@/lib/account-actions", () => accountActionsMock);

describe("signup API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accountActionsMock.issueAccountActionToken.mockResolvedValue("verify-token");
    accountActionsMock.sendEmailVerificationEmail.mockResolvedValue({ ok: true });
  });

  it("rejects invalid payloads", async () => {
    const { POST } = await import("@/app/api/auth/signup/route");
    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "invalid-email", password: "short" }),
      })
    );
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("valid email");
  });

  it("rejects duplicate email addresses", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "user-1" });
    const { POST } = await import("@/app/api/auth/signup/route");

    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Existing User", email: "existing@example.com", password: "Password123!" }),
      })
    );

    expect(response.status).toBe(409);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("creates a member account with a hashed password", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: "user-2",
      name: "New User",
      email: "new.user@example.com",
      role: "member",
    });
    const { POST } = await import("@/app/api/auth/signup/route");

    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "New User", email: "NEW.USER@EXAMPLE.COM", password: "Password123!" }),
      })
    );
    const payload = (await response.json()) as { role: string; email: string };

    expect(response.status).toBe(201);
    expect(payload.role).toBe("member");
    expect(payload.email).toBe("new.user@example.com");

    const createArgs = prismaMock.user.create.mock.calls[0]?.[0] as {
      data: { email: string; role: string; password: string };
    };
    expect(createArgs.data.email).toBe("new.user@example.com");
    expect(createArgs.data.role).toBe("member");
    expect(createArgs.data.password).not.toBe("Password123!");
    await expect(bcrypt.compare("Password123!", createArgs.data.password)).resolves.toBe(true);

    expect(accountActionsMock.issueAccountActionToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-2",
        action: "email_verify",
      })
    );
    expect(accountActionsMock.sendEmailVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "new.user@example.com" })
    );
  });
});
