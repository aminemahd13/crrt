import { beforeEach, describe, expect, it, vi } from "vitest";

const decodeApplicationIdMock = vi.fn();
const encodeRegistrationApplicationIdMock = vi.fn((id: string) => `reg:${id}`);
const encodeSubmissionApplicationIdMock = vi.fn((id: string) => `sub:${id}`);

const toDisplayRecordFromSubmissionMock = vi.fn();
const parseSubmissionDataMock = vi.fn();
const updateSubmissionFromDisplayPatchMock = vi.fn();

const prismaMock = {
  eventRegistration: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  formSubmission: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/application-id", () => ({
  decodeApplicationId: decodeApplicationIdMock,
  encodeRegistrationApplicationId: encodeRegistrationApplicationIdMock,
  encodeSubmissionApplicationId: encodeSubmissionApplicationIdMock,
}));

vi.mock("@/lib/form-submission", () => ({
  toDisplayRecordFromSubmission: toDisplayRecordFromSubmissionMock,
  parseSubmissionData: parseSubmissionDataMock,
  updateSubmissionFromDisplayPatch: updateSubmissionFromDisplayPatchMock,
}));

describe("admin application detail API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    decodeApplicationIdMock.mockReturnValue({
      type: "registration",
      id: "reg-1",
    });
    toDisplayRecordFromSubmissionMock.mockReturnValue({ motivation: "updated value" });
    parseSubmissionDataMock.mockReturnValue({
      schemaVersion: 1,
      answers: {},
      legacyUnmapped: {},
    });
    updateSubmissionFromDisplayPatchMock.mockReturnValue({
      schemaVersion: 2,
      answers: {
        "field-1": {
          type: "text",
          value: "updated value",
        },
      },
      legacy: { unmapped: {} },
    });
  });

  it("PATCH updates statuses and payload through detail endpoint", async () => {
    const baseEvent = {
      id: "event-1",
      title: "Robotics Bootcamp",
      slug: "robotics-bootcamp",
      startDate: new Date("2026-04-01T10:00:00.000Z"),
      endDate: null,
      location: "Lab",
    };

    const baseUser = {
      id: "user-1",
      name: "Ada",
      email: "ada@example.com",
      phone: null,
      organization: null,
      city: null,
    };

    const baseSubmission = {
      id: "sub-1",
      status: "new",
      data: { motivation: "old value" },
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      updatedAt: new Date("2026-03-01T10:00:00.000Z"),
      form: {
        fields: [
          {
            id: "field-1",
            label: "Motivation",
            type: "text",
            required: false,
            placeholder: null,
            options: null,
            order: 0,
            sectionId: null,
            visibility: null,
            config: null,
          },
        ],
        sections: [],
      },
    };

    prismaMock.eventRegistration.findUnique
      .mockResolvedValueOnce({
        id: "reg-1",
        status: "registered",
        note: "old note",
        createdAt: new Date("2026-03-01T09:00:00.000Z"),
        updatedAt: new Date("2026-03-01T09:00:00.000Z"),
        waitlistedAt: null,
        approvedAt: null,
        rejectedAt: null,
        cancelledAt: null,
        user: baseUser,
        event: baseEvent,
        formSubmission: baseSubmission,
      })
      .mockResolvedValueOnce({
        id: "reg-1",
        status: "approved",
        note: "reviewed",
        createdAt: new Date("2026-03-01T09:00:00.000Z"),
        updatedAt: new Date("2026-03-01T11:00:00.000Z"),
        waitlistedAt: null,
        approvedAt: new Date("2026-03-01T11:00:00.000Z"),
        rejectedAt: null,
        cancelledAt: null,
        user: baseUser,
        event: baseEvent,
        formSubmission: {
          ...baseSubmission,
          status: "accepted",
          data: {
            schemaVersion: 2,
            answers: {
              "field-1": {
                type: "text",
                value: "updated value",
              },
            },
            legacy: { unmapped: {} },
          },
          updatedAt: new Date("2026-03-01T11:00:00.000Z"),
        },
      });

    prismaMock.eventRegistration.update.mockResolvedValue({
      id: "reg-1",
    });
    prismaMock.formSubmission.update.mockResolvedValue({
      id: "sub-1",
    });

    const { PATCH } = await import("@/app/api/admin/applications/[applicationId]/route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/applications/reg:reg-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationStatus: "approved",
          reviewStatus: "accepted",
          note: "reviewed",
          data: {
            Motivation: "updated value",
          },
        }),
      }),
      { params: Promise.resolve({ applicationId: "reg:reg-1" }) }
    );

    expect(response.status).toBe(200);
    expect(prismaMock.eventRegistration.update).toHaveBeenCalledWith({
      where: { id: "reg-1" },
      data: {
        status: "approved",
        note: "reviewed",
      },
    });
    expect(updateSubmissionFromDisplayPatchMock).toHaveBeenCalled();
    expect(prismaMock.formSubmission.update).toHaveBeenCalledWith({
      where: { id: "sub-1" },
      data: {
        status: "accepted",
        data: {
          schemaVersion: 2,
          answers: {
            "field-1": {
              type: "text",
              value: "updated value",
            },
          },
          legacy: { unmapped: {} },
        },
        schemaVersion: 2,
      },
    });

    const payload = (await response.json()) as { registration: { status: string | null } };
    expect(payload.registration.status).toBe("approved");
  });
});
