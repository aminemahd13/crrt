import { NextResponse } from "next/server";
import { setMessageReadState } from "@/lib/mailbox";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/messages/[id]/read", "POST");
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const seen = typeof body.seen === "boolean" ? body.seen : true;
    await setMessageReadState(id, seen);
    logInfo("admin_inbox_message_read_updated", {
      pathname: "/api/admin/inbox/messages/[id]/read",
      method: "POST",
      status: 200,
      requestId,
      details: { messageId: id, seen },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    recordApiError("/api/admin/inbox/messages/[id]/read", "POST");
    logError("admin_inbox_message_read_failed", {
      pathname: "/api/admin/inbox/messages/[id]/read",
      method: "POST",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to update read state" }, { status: 500 });
  }
}
