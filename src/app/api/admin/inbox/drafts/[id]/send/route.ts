import { NextResponse } from "next/server";
import { sendMailboxDraft } from "@/lib/mailbox";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/drafts/[id]/send", "POST");
  try {
    const { id } = await params;
    const result = await sendMailboxDraft(id);
    logInfo("admin_inbox_draft_sent", {
      pathname: "/api/admin/inbox/drafts/[id]/send",
      method: "POST",
      status: 200,
      requestId,
      details: { draftId: id, threadId: result.threadId },
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /not found|required|invalid|attachments/i.test(message) ? 400 : 500;
    if (status === 500) {
      recordApiError("/api/admin/inbox/drafts/[id]/send", "POST");
    }
    logError("admin_inbox_draft_send_failed", {
      pathname: "/api/admin/inbox/drafts/[id]/send",
      method: "POST",
      status,
      requestId,
      details: { message },
    });
    return NextResponse.json({ error: message }, { status });
  }
}
