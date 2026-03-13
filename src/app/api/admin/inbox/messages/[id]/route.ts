import { NextResponse } from "next/server";
import { hardDeleteMessage } from "@/lib/mailbox";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/messages/[id]", "DELETE");
  try {
    const { id } = await params;
    await hardDeleteMessage(id);
    logInfo("admin_inbox_message_deleted", {
      pathname: "/api/admin/inbox/messages/[id]",
      method: "DELETE",
      status: 200,
      requestId,
      details: { messageId: id },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      message === "Message not found."
        ? 404
        : message === "Only messages in Trash can be permanently deleted."
          ? 400
          : 500;
    recordApiError("/api/admin/inbox/messages/[id]", "DELETE");
    logError("admin_inbox_message_delete_failed", {
      pathname: "/api/admin/inbox/messages/[id]",
      method: "DELETE",
      status,
      requestId,
      details: { message },
    });
    return NextResponse.json(
      { error: status === 500 ? "Failed to delete message" : message },
      { status }
    );
  }
}
