import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  session: {
    deleteMany: vi.fn(),
  },
};

const accountActionsMock = {
  ACCOUNT_ACTION: {
    PASSWORD_RESET: "password_reset",
  },
  issueAccountActionToken: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  consumeAccountActionToken: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/account-actions", () => accountActionsMock);

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/lib/metrics", () => ({
  recordApiRequest: vi.fn(),
  recordApiError: vi.fn(),
}));

describe("password reset APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accountActionsMock.issueAccountActionToken.mockResolvedValue("reset-token");
    accountActionsMock.sendPasswordResetEmail.mockResolvedValue({ ok: true });
  });

  it("queues reset email when account exists", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      email: "member@example.com",
      name: "Member",
    });

    const { POST } = await import("@/app/api/auth/password-reset/request/route");
    const response = await POST(
      new Request("http://localhost/api/auth/password-reset/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "member@example.com" }),
      })
    );

    expect(response.status).toBe(200);
    expect(accountActionsMock.issueAccountActionToken).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", action: "password_reset" })
    );
    expect(accountActionsMock.sendPasswordResetEmail).toHaveBeenCalled();
  });

  it("resets password when token is valid", async () => {
    accountActionsMock.consumeAccountActionToken.mockResolvedValueOnce({
      userId: "user-2",
    });

    const { POST } = await import("@/app/api/auth/password-reset/confirm/route");
    const response = await POST(
      new Request("http://localhost/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "abc", password: "Password123!" }),
      })
    );

    expect(response.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-2" },
      })
    );
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-2" } });
  });

  it("rejects invalid reset tokens", async () => {
    accountActionsMock.consumeAccountActionToken.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/auth/password-reset/confirm/route");
    const response = await POST(
      new Request("http://localhost/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "invalid", password: "Password123!" }),
      })
    );

    expect(response.status).toBe(400);
  });
});
