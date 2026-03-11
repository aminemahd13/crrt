import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const sendTemplatedEmailMock = vi.fn();

const prismaMock = {
  event: {
    findUnique: vi.fn(),
  },
  eventRegistration: {
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  formSubmission: {
    deleteMany: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/email", () => ({
  sendTemplatedEmail: sendTemplatedEmailMock,
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/lib/metrics", () => ({
  recordApiRequest: vi.fn(),
  recordApiError: vi.fn(),
  recordRegistrationCreated: vi.fn(),
}));

describe("event registration APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated registration attempts", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/events/[eventId]/registrations/route");

    const response = await POST(new Request("http://localhost/api/events/a/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }), {
      params: Promise.resolve({ eventId: "event-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("places user on waitlist when capacity is reached", async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { id: "user-1", email: "user@example.com", name: "User One" },
    });
    prismaMock.event.findUnique.mockResolvedValueOnce({
      id: "event-1",
      title: "Event 1",
      slug: "event-1",
      registrationMode: "internal",
      registrationReviewMode: "auto",
      capacity: 1,
      form: { id: "form-1", fields: [] },
    });
    prismaMock.eventRegistration.count.mockResolvedValueOnce(1);
    prismaMock.eventRegistration.findUnique.mockResolvedValueOnce(null);
    prismaMock.eventRegistration.create.mockResolvedValueOnce({
      id: "reg-1",
      eventId: "event-1",
      userId: "user-1",
      status: "waitlisted",
    });

    const { POST } = await import("@/app/api/events/[eventId]/registrations/route");
    const response = await POST(new Request("http://localhost/api/events/event-1/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }), {
      params: Promise.resolve({ eventId: "event-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.status).toBe("waitlisted");
    expect(sendTemplatedEmailMock).toHaveBeenCalled();
  });
});
