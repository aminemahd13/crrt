import { beforeEach, describe, expect, it, vi } from "vitest";

const mailboxMock = {
  deleteMailboxDraft: vi.fn(),
  getMailboxDraft: vi.fn(),
  parseDraftPayload: vi.fn(),
  updateMailboxDraft: vi.fn(),
};

vi.mock("@/lib/mailbox", () => mailboxMock);
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock("@/lib/metrics", () => ({ recordApiRequest: vi.fn(), recordApiError: vi.fn() }));

describe("admin inbox draft id API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mailboxMock.parseDraftPayload.mockReturnValue({
      to: [],
      cc: [],
      bcc: [],
      subject: "Draft subject",
      htmlBody: "<p>Body</p>",
      textBody: "Body",
      threadId: null,
      attachments: [],
    });
  });

  it("rejects update when version is missing", async () => {
    const { PUT } = await import("@/app/api/admin/inbox/drafts/[id]/route");
    const response = await PUT(
      new Request("http://localhost/api/admin/inbox/drafts/draft-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "No version" }),
      }),
      { params: Promise.resolve({ id: "draft-1" }) }
    );

    const payload = await response.json();
    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/version/i);
    expect(mailboxMock.updateMailboxDraft).not.toHaveBeenCalled();
  });

  it("returns 409 for optimistic draft version conflicts", async () => {
    mailboxMock.updateMailboxDraft.mockRejectedValueOnce(
      new Error("Draft version conflict. Refresh and try again.")
    );

    const { PUT } = await import("@/app/api/admin/inbox/drafts/[id]/route");
    const response = await PUT(
      new Request("http://localhost/api/admin/inbox/drafts/draft-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: 4, subject: "Update" }),
      }),
      { params: Promise.resolve({ id: "draft-1" }) }
    );

    const payload = await response.json();
    expect(response.status).toBe(409);
    expect(payload.error).toMatch(/conflict/i);
  });
});
