import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();

const prismaMock = {
  eventRegistration: {
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
  formSubmission: {
    findUnique: vi.fn(),
    delete: vi.fn(),
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

vi.mock("@/lib/email", () => ({
  sendTemplatedEmail: vi.fn(),
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

describe("admin event registration API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: { id: "admin-1", email: "admin@example.com" },
    });
  });

  it("deletes registration and linked submission", async () => {
    prismaMock.eventRegistration.findUnique.mockResolvedValueOnce({
      id: "registration-1",
      eventId: "event-1",
    });
    prismaMock.formSubmission.findUnique.mockResolvedValueOnce({
      id: "submission-1",
    });

    prismaMock.$transaction.mockImplementationOnce(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => {
      return callback(prismaMock);
    });

    const { DELETE } = await import("@/app/api/admin/events/[id]/registrations/[registrationId]/route");
    const response = await DELETE(
      new Request("http://localhost/api/admin/events/event-1/registrations/registration-1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "event-1", registrationId: "registration-1" }) }
    );

    const payload = (await response.json()) as {
      ok: boolean;
      deleted: { registrationId: string | null; submissionId: string | null };
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.deleted).toEqual({
      registrationId: "registration-1",
      submissionId: "submission-1",
    });
    expect(prismaMock.formSubmission.delete).toHaveBeenCalledWith({
      where: { id: "submission-1" },
    });
    expect(prismaMock.eventRegistration.delete).toHaveBeenCalledWith({
      where: { id: "registration-1" },
    });
  });

  it("returns success when registration already missing", async () => {
    prismaMock.eventRegistration.findUnique.mockResolvedValueOnce(null);

    const { DELETE } = await import("@/app/api/admin/events/[id]/registrations/[registrationId]/route");
    const response = await DELETE(
      new Request("http://localhost/api/admin/events/event-1/registrations/registration-1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "event-1", registrationId: "registration-1" }) }
    );

    const payload = (await response.json()) as {
      ok: boolean;
      deleted: { registrationId: string | null; submissionId: string | null };
    };

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      deleted: {
        registrationId: null,
        submissionId: null,
      },
    });
  });
});
