import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const prismaMock = {
  resource: {
    findMany: vi.fn(),
  },
};

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
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

describe("private resources API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import("@/app/api/resources/private/route");

    const response = await GET(new Request("http://localhost/api/resources/private"));
    expect(response.status).toBe(401);
  });

  it("returns private resources for authenticated users", async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { id: "user-1" },
    });
    prismaMock.resource.findMany.mockResolvedValueOnce([
      {
        id: "resource-1",
        title: "Private CAD Files",
        slug: "private-cad-files",
        description: "private",
        url: "https://example.com/private",
        type: "document",
        category: { id: "cat-1", name: "CAD", slug: "cad" },
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    const { GET } = await import("@/app/api/resources/private/route");
    const response = await GET(new Request("http://localhost/api/resources/private"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.resources).toHaveLength(1);
  });
});
