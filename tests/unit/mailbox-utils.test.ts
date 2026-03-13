import { describe, expect, it } from "vitest";
import {
  OUTGOING_ATTACHMENT_MAX_TOTAL_BYTES,
  deriveThreadKey,
  normalizeMessageId,
  normalizeReferences,
  parseAttachmentInputs,
} from "@/lib/mailbox/utils";

describe("mailbox utils", () => {
  it("normalizes message ids and references", () => {
    expect(normalizeMessageId("<AbC@Example.com>")).toBe("abc@example.com");
    expect(normalizeReferences(["<One@Example.com>", "  ", "<Two@Example.com>"])).toEqual([
      "one@example.com",
      "two@example.com",
    ]);
  });

  it("prefers references for thread key", () => {
    const key = deriveThreadKey({
      references: ["root-message@example.com"],
      inReplyTo: "reply-parent@example.com",
      messageId: "current@example.com",
      subject: "Status update",
      date: new Date("2026-03-10T12:00:00.000Z"),
      fromEmail: "sender@example.com",
    });
    expect(key).toBe("root-message@example.com");
  });

  it("falls back to deterministic hash when no threading headers exist", () => {
    const first = deriveThreadKey({
      references: [],
      inReplyTo: null,
      messageId: null,
      subject: "Re: Weekly sync",
      date: new Date("2026-03-10T09:30:00.000Z"),
      fromEmail: "sender@example.com",
    });
    const second = deriveThreadKey({
      references: [],
      inReplyTo: null,
      messageId: null,
      subject: "Weekly sync",
      date: new Date("2026-03-10T22:15:00.000Z"),
      fromEmail: "sender@example.com",
    });

    expect(first).toBe(second);
    expect(first.startsWith("fallback-")).toBe(true);
  });

  it("rejects malformed attachment base64", () => {
    expect(() =>
      parseAttachmentInputs([
        {
          filename: "bad.txt",
          mimeType: "text/plain",
          contentBase64: "###invalid-base64###",
        },
      ])
    ).toThrow(/base64/i);
  });

  it("enforces 25 MB total attachment cap", () => {
    const oversized = Buffer.alloc(OUTGOING_ATTACHMENT_MAX_TOTAL_BYTES + 1, 1).toString("base64");
    expect(() =>
      parseAttachmentInputs([
        {
          filename: "huge.bin",
          mimeType: "application/octet-stream",
          contentBase64: oversized,
        },
      ])
    ).toThrow(/25 MB/i);
  });
});
