import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  formSubmission: {
    update: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("admin submissions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates submission status", async () => {
    prismaMock.formSubmission.update.mockResolvedValueOnce({
      id: "submission-1",
      status: "accepted",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-01T11:00:00.000Z"),
      data: {},
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
});
