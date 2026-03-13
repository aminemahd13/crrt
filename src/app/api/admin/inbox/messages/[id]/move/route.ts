import { NextResponse } from "next/server";
import { moveMessageToFolder } from "@/lib/mailbox";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/messages/[id]/move", "POST");
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const targetFolder = typeof body.targetFolder === "string" ? body.targetFolder : "";
    if (!["inbox", "archive", "trash"].includes(targetFolder)) {
      return NextResponse.json({ error: "Invalid destination folder." }, { status: 400 });
    }

    await moveMessageToFolder(id, targetFolder as "inbox" | "archive" | "trash");
    logInfo("admin_inbox_message_moved", {
      pathname: "/api/admin/inbox/messages/[id]/move",
      method: "POST",
      status: 200,
      requestId,
      details: { messageId: id, targetFolder },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    recordApiError("/api/admin/inbox/messages/[id]/move", "POST");
    logError("admin_inbox_message_move_failed", {
      pathname: "/api/admin/inbox/messages/[id]/move",
      method: "POST",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to move message" }, { status: 500 });
  }
}
