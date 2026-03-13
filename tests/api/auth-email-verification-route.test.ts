import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  user: {
    update: vi.fn(),
  },
  accountActionToken: {
    updateMany: vi.fn(),
  },
};

const accountActionsMock = {
  ACCOUNT_ACTION: {
    EMAIL_VERIFY: "email_verify",
    EMAIL_CHANGE: "email_change",
  },
  consumeAccountActionToken: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/account-actions", () => accountActionsMock);
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock("@/lib/metrics", () => ({ recordApiRequest: vi.fn(), recordApiError: vi.fn() }));

describe("email verification API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies an account verification token", async () => {
    accountActionsMock.consumeAccountActionToken
      .mockResolvedValueOnce({ userId: "user-1" })
      .mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/auth/email-verification/verify/route");
    const response = await POST(
      new Request("http://localhost/api/auth/email-verification/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "verify" }),
      })
    );

    expect(response.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } })
    );
  });

  it("applies pending email for email-change token", async () => {
    accountActionsMock.consumeAccountActionToken
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ userId: "user-2", pendingEmail: "new@example.com" });

    const { POST } = await import("@/app/api/auth/email-verification/verify/route");
    const response = await POST(
      new Request("http://localhost/api/auth/email-verification/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "change" }),
      })
    );

    expect(response.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-2" },
        data: expect.objectContaining({ email: "new@example.com" }),
      })
    );
  });
});
