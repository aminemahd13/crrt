import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  eventRegistration: {
    findMany: vi.fn(),
  },
  formSubmission: {
    findMany: vi.fn(),
  },
  event: {
    findMany: vi.fn(),
  },
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

describe("admin applications API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns merged registrations and orphan submissions", async () => {
    prismaMock.eventRegistration.findMany.mockResolvedValueOnce([
      {
        id: "reg-1",
        eventId: "event-1",
        userId: "user-1",
        status: "registered",
        note: "Needs follow up",
        createdAt: new Date("2026-03-01T10:00:00.000Z"),
        updatedAt: new Date("2026-03-01T11:00:00.000Z"),
        user: {
          id: "user-1",
          name: "Ada",
          email: "ada@example.com",
        },
        event: {
          id: "event-1",
          title: "Workshop",
          slug: "workshop",
        },
        formSubmission: {
          id: "sub-1",
          status: "in_review",
          data: { motivation: "build robots" },
          createdAt: new Date("2026-03-01T10:30:00.000Z"),
          updatedAt: new Date("2026-03-01T11:30:00.000Z"),
        },
      },
    ]);

    prismaMock.formSubmission.findMany.mockResolvedValueOnce([
      {
        id: "sub-2",
        status: "new",
        data: { notes: "orphan" },
        createdAt: new Date("2026-03-02T10:00:00.000Z"),
        updatedAt: new Date("2026-03-02T10:10:00.000Z"),
        form: {
          event: {
            id: "event-1",
            title: "Workshop",
            slug: "workshop",
          },
        },
      },
    ]);

    prismaMock.event.findMany.mockResolvedValueOnce([
      { id: "event-1", title: "Workshop", slug: "workshop" },
    ]);

    const { GET } = await import("@/app/api/admin/applications/route");
    const response = await GET(
      new Request("http://localhost/api/admin/applications?page=1&pageSize=25")
    );

    const payload = (await response.json()) as {
      items: Array<{ registrationId: string | null; submissionId: string | null }>;
      total: number;
      events: Array<{ eventId: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.total).toBe(2);
    expect(payload.items[0].submissionId).toBe("sub-2");
    expect(payload.items[1].registrationId).toBe("reg-1");
    expect(payload.events).toEqual([{ eventId: "event-1", eventTitle: "Workshop", eventSlug: "workshop" }]);
  });
});
