import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

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

describe("admin users account management API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: { id: "admin-self", email: "self@example.com" },
    });
  });

  it("prevents deleting your own account", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "admin-self",
      role: "admin",
      email: "self@example.com",
    });

    const { DELETE } = await import("@/app/api/admin/users/[id]/route");
    const response = await DELETE(
      new Request("http://localhost/api/admin/users/admin-self", { method: "DELETE" }),
      { params: Promise.resolve({ id: "admin-self" }) }
    );

    expect(response.status).toBe(400);
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it("prevents deleting the last admin", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "admin-2",
      role: "admin",
      email: "admin2@example.com",
    });
    prismaMock.user.count.mockResolvedValueOnce(1);

    const { DELETE } = await import("@/app/api/admin/users/[id]/route");
    const response = await DELETE(
      new Request("http://localhost/api/admin/users/admin-2", { method: "DELETE" }),
      { params: Promise.resolve({ id: "admin-2" }) }
    );

    expect(response.status).toBe(400);
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it("allows deleting a non-admin user", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "member-1",
      role: "member",
      email: "member@example.com",
    });

    const { DELETE } = await import("@/app/api/admin/users/[id]/route");
    const response = await DELETE(
      new Request("http://localhost/api/admin/users/member-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "member-1" }) }
    );

    expect(response.status).toBe(200);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: "member-1" } });
  });

  it("prevents demoting your own admin role", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "admin-self",
      role: "admin",
      email: "self@example.com",
    });

    const { PATCH } = await import("@/app/api/admin/users/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/users/admin-self", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "member" }),
      }),
      { params: Promise.resolve({ id: "admin-self" }) }
    );

    expect(response.status).toBe(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("allows promoting a member to admin", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "member-2",
      role: "member",
      email: "member2@example.com",
    });
    prismaMock.user.update.mockResolvedValueOnce({
      id: "member-2",
      role: "admin",
      email: "member2@example.com",
    });

    const { PATCH } = await import("@/app/api/admin/users/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/users/member-2", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "admin" }),
      }),
      { params: Promise.resolve({ id: "member-2" }) }
    );

    expect(response.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "member-2" },
      data: { role: "admin" },
      select: {
        id: true,
        role: true,
        email: true,
      },
    });
  });
});
