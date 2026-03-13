import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const compareMock = vi.fn();
const hashMock = vi.fn();

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: compareMock,
    hash: hashMock,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/lib/metrics", () => ({
  recordApiRequest: vi.fn(),
  recordApiError: vi.fn(),
}));

describe("admin settings password API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({ user: { id: "admin-1" } });
    hashMock.mockResolvedValue("new-hash");
  });

  it("sets a new password when account has no existing credentials", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "admin-1", password: null });

    const { PUT } = await import("@/app/api/admin/settings/password/route");
    const response = await PUT(
      new Request("http://localhost/api/admin/settings/password", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: "", newPassword: "NewPassword123!" }),
      })
    );

    expect(response.status).toBe(200);
    expect(compareMock).not.toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "admin-1" },
      data: {
        password: "new-hash",
        mustRotatePassword: false,
      },
    });
  });

  it("requires current password when credentials already exist", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "admin-1", password: "existing-hash" });

    const { PUT } = await import("@/app/api/admin/settings/password/route");
    const response = await PUT(
      new Request("http://localhost/api/admin/settings/password", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: "", newPassword: "NewPassword123!" }),
      })
    );

    expect(response.status).toBe(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
