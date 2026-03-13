import { beforeEach, describe, expect, it, vi } from "vitest";

const mailboxMock = {
  getMailboxStatus: vi.fn(),
  syncMailbox: vi.fn(),
};

vi.mock("@/lib/mailbox", () => mailboxMock);
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock("@/lib/metrics", () => ({ recordApiRequest: vi.fn(), recordApiError: vi.fn() }));

describe("admin inbox sync API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 409 when sync lock is already held", async () => {
    mailboxMock.syncMailbox.mockResolvedValueOnce({
      ok: false,
      locked: true,
      imported: 0,
      updated: 0,
      details: [],
    });

    const { POST } = await import("@/app/api/admin/inbox/sync/route");
    const response = await POST(
      new Request("http://localhost/api/admin/inbox/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderKey: "inbox" }),
      })
    );

    const payload = await response.json();
    expect(response.status).toBe(409);
    expect(payload.locked).toBe(true);
  });

  it("returns 500 when sync fails without lock contention", async () => {
    mailboxMock.syncMailbox.mockResolvedValueOnce({
      ok: false,
      locked: false,
      imported: 2,
      updated: 3,
      details: [],
      error: "imap failure",
    });

    const { POST } = await import("@/app/api/admin/inbox/sync/route");
    const response = await POST(
      new Request("http://localhost/api/admin/inbox/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderKey: "inbox" }),
      })
    );

    const payload = await response.json();
    expect(response.status).toBe(500);
    expect(payload.error).toBe("imap failure");
  });

  it("returns mailbox status payload on GET", async () => {
    mailboxMock.getMailboxStatus.mockResolvedValueOnce({
      mailbox: "shared",
      syncIntervalSeconds: 30,
      initialSyncDays: 90,
      folders: { inbox: "INBOX", sent: "Sent", drafts: "Drafts", archive: "Archive", trash: "Trash" },
      hasSmtpSecrets: true,
      hasImapSecrets: true,
      cursors: [],
    });

    const { GET } = await import("@/app/api/admin/inbox/sync/route");
    const response = await GET(new Request("http://localhost/api/admin/inbox/sync"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.mailbox).toBe("shared");
    expect(payload.hasImapSecrets).toBe(true);
  });
});
