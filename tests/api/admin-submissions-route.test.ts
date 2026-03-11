import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();

const prismaMock = {
  formSubmission: {
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  eventRegistration: {
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(),
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
  recordApplicationAction: vi.fn(),
  recordApplicationFailure: vi.fn(),
}));

describe("admin submissions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: { id: "admin-1", email: "admin@example.com" },
    });
  });

  it("updates submission status", async () => {
    prismaMock.formSubmission.findUnique.mockResolvedValueOnce({
      id: "submission-1",
      status: "new",
      data: { motivation: "old" },
      eventRegistrationId: "registration-1",
    });
    prismaMock.formSubmission.update.mockResolvedValueOnce({
      id: "submission-1",
      status: "accepted",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-01T11:00:00.000Z"),
      data: { motivation: "old" },
      formId: "form-1",
      eventRegistrationId: "registration-1",
    });

    const { PUT } = await import("@/app/api/admin/submissions/[id]/route");
    const response = await PUT(
      new Request("http://localhost/api/admin/submissions/submission-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      }),
      { params: Promise.resolve({ id: "submission-1" }) }
    );

    const payload = (await response.json()) as { status: string };

    expect(response.status).toBe(200);
    expect(payload.status).toBe("accepted");
    expect(prismaMock.formSubmission.update).toHaveBeenCalledWith({
      where: { id: "submission-1" },
      data: { status: "accepted" },
    });
  });

  it("rejects payload edits with unknown keys", async () => {
    prismaMock.formSubmission.findUnique.mockResolvedValueOnce({
      id: "submission-1",
      status: "new",
      data: { motivation: "old" },
      eventRegistrationId: "registration-1",
    });

    const { PUT } = await import("@/app/api/admin/submissions/[id]/route");
    const response = await PUT(
      new Request("http://localhost/api/admin/submissions/submission-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { unknown: "value" } }),
      }),
      { params: Promise.resolve({ id: "submission-1" }) }
    );

    expect(response.status).toBe(400);
    expect(prismaMock.formSubmission.update).not.toHaveBeenCalled();
  });

  it("deletes submission and linked registration", async () => {
    prismaMock.formSubmission.findUnique.mockResolvedValueOnce({
      id: "submission-1",
      eventRegistrationId: "registration-1",
    });
    prismaMock.eventRegistration.deleteMany.mockResolvedValueOnce({ count: 1 });

    prismaMock.$transaction.mockImplementationOnce(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => {
      return callback(prismaMock);
    });

    const { DELETE } = await import("@/app/api/admin/submissions/[id]/route");
    const response = await DELETE(
      new Request("http://localhost/api/admin/submissions/submission-1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "submission-1" }) }
    );

    const payload = (await response.json()) as {
      ok: boolean;
      deleted: { submissionId: string | null; registrationId: string | null };
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.deleted).toEqual({
      submissionId: "submission-1",
      registrationId: "registration-1",
    });
    expect(prismaMock.formSubmission.delete).toHaveBeenCalledWith({ where: { id: "submission-1" } });
    expect(prismaMock.eventRegistration.deleteMany).toHaveBeenCalledWith({
      where: { id: "registration-1" },
    });
  });
});
