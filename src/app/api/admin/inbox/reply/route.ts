import { NextResponse } from "next/server";
import { parseOutgoingAttachments, replyToMailboxMessage } from "@/lib/mailbox";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/reply", "POST");
  try {
    const body = await request.json();
    const messageId = typeof body.messageId === "string" ? body.messageId.trim() : "";
    const mode = body.mode === "reply_all" ? "reply_all" : "reply";
    const htmlBody = typeof body.htmlBody === "string" ? body.htmlBody : "";
    const textBody = typeof body.textBody === "string" ? body.textBody : "";
    const attachments = parseOutgoingAttachments(body.attachments);

    if (!messageId) {
      return NextResponse.json({ error: "messageId is required." }, { status: 400 });
    }
    if (!htmlBody.trim() && !textBody.trim()) {
      return NextResponse.json({ error: "Reply body is required." }, { status: 400 });
    }

    const result = await replyToMailboxMessage({
      messageId,
      mode,
      htmlBody,
      textBody,
      attachments,
    });
    logInfo("admin_inbox_reply_success", {
      pathname: "/api/admin/inbox/reply",
      method: "POST",
      status: 200,
      requestId,
      details: {
        sourceMessageId: messageId,
        threadId: result.threadId,
      },
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /required|invalid|not found/i.test(message) ? 400 : 500;
    if (status === 500) {
      recordApiError("/api/admin/inbox/reply", "POST");
    }
    logError("admin_inbox_reply_failed", {
      pathname: "/api/admin/inbox/reply",
      method: "POST",
      status,
      requestId,
      details: { message },
    });
    return NextResponse.json({ error: message }, { status });
  }
}
