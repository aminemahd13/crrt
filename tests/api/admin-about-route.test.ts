import { beforeEach, describe, expect, it, vi } from "vitest";

const txMock = {
  aboutConfig: {
    upsert: vi.fn(),
  },
  teamMember: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  timelineMilestone: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
};

const prismaMock = {
  aboutConfig: {
    findUnique: vi.fn(),
  },
  teamMember: {
    findMany: vi.fn(),
  },
  timelineMilestone: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<void>) => callback(txMock)),
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("admin about API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default config when about config is missing", async () => {
    prismaMock.aboutConfig.findUnique.mockResolvedValueOnce(null);
    prismaMock.teamMember.findMany.mockResolvedValueOnce([]);
    prismaMock.timelineMilestone.findMany.mockResolvedValueOnce([]);

    const { GET } = await import("@/app/api/admin/about/route");
    const response = await GET();
    const payload = (await response.json()) as {
      config: {
        heroTitle: string;
      };
      members: unknown[];
      milestones: unknown[];
    };

    expect(response.status).toBe(200);
    expect(payload.config.heroTitle).toBe("About CRRT");
    expect(payload.members).toEqual([]);
    expect(payload.milestones).toEqual([]);
  });

  it("updates config, members, and milestones in a transaction", async () => {
    txMock.teamMember.findMany.mockResolvedValueOnce([{ id: "cuid-member-1" }]);
    txMock.timelineMilestone.findMany.mockResolvedValueOnce([{ id: "cuid-milestone-1" }]);

    const { PUT } = await import("@/app/api/admin/about/route");
    const response = await PUT(
      new Request("http://localhost/api/admin/about", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          config: {
            heroTitle: "About Club",
            storyText: "Updated story",
            teamCurrentLabel: "Board",
            teamAlumniLabel: "Ex Board",
            timelineHeading: "History",
            valueCards: [{ title: "Innovation", desc: "Build and test." }],
          },
          members: [
            { id: "cuid-member-1", name: "Nour", role: "President", isAlumni: false },
            { id: "new-member", name: "Wissal", role: "General Secretary", isAlumni: false },
          ],
          milestones: [
            { id: "cuid-milestone-1", year: 2008, title: "Founded", description: "" },
            { id: "new-milestone", year: 2026, title: "Board Announced", description: "" },
          ],
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(txMock.aboutConfig.upsert).toHaveBeenCalledTimes(1);
    expect(txMock.teamMember.update).toHaveBeenCalledWith({
      where: { id: "cuid-member-1" },
      data: {
        name: "Nour",
        role: "President",
        image: null,
        linkedIn: null,
        isAlumni: false,
        order: 0,
      },
    });
    expect(txMock.teamMember.create).toHaveBeenCalledWith({
      data: {
        name: "Wissal",
        role: "General Secretary",
        image: null,
        linkedIn: null,
        isAlumni: false,
        order: 1,
      },
    });
    expect(txMock.timelineMilestone.update).toHaveBeenCalledWith({
      where: { id: "cuid-milestone-1" },
      data: {
        year: 2008,
        title: "Founded",
        description: null,
        order: 0,
      },
    });
    expect(txMock.timelineMilestone.create).toHaveBeenCalledWith({
      data: {
        year: 2026,
        title: "Board Announced",
        description: null,
        order: 1,
      },
    });
  });

  it("rejects members with missing role", async () => {
    const { PUT } = await import("@/app/api/admin/about/route");
    const response = await PUT(
      new Request("http://localhost/api/admin/about", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          config: { heroTitle: "About" },
          members: [{ name: "Nour", role: "" }],
          milestones: [],
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
