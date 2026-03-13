import { NextResponse } from "next/server";
import { parseSendInput, sendMailboxMessage } from "@/lib/mailbox";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/send", "POST");
  try {
    const body = await request.json();
    const payload = parseSendInput(body);
    const result = await sendMailboxMessage(payload);
    logInfo("admin_inbox_send_success", {
      pathname: "/api/admin/inbox/send",
      method: "POST",
      status: 200,
      requestId,
      details: {
        threadId: result.threadId,
        messageId: result.messageId,
      },
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /required|invalid|recipient|subject|body/i.test(message) ? 400 : 500;
    if (status === 500) {
      recordApiError("/api/admin/inbox/send", "POST");
    }
    logError("admin_inbox_send_failed", {
      pathname: "/api/admin/inbox/send",
      method: "POST",
      status,
      requestId,
      details: { message },
    });
    return NextResponse.json({ error: message }, { status });
  }
}
