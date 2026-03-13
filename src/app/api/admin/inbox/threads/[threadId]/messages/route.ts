import { NextResponse } from "next/server";
import { getThreadMessages } from "@/lib/mailbox";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/threads/[threadId]/messages", "GET");
  try {
    const { threadId } = await params;
    const messages = await getThreadMessages(threadId);
    logInfo("admin_inbox_thread_messages_loaded", {
      pathname: "/api/admin/inbox/threads/[threadId]/messages",
      method: "GET",
      status: 200,
      requestId,
      details: { threadId, count: messages.length },
    });
    return NextResponse.json({ items: messages });
  } catch (error) {
    recordApiError("/api/admin/inbox/threads/[threadId]/messages", "GET");
    logError("admin_inbox_thread_messages_failed", {
      pathname: "/api/admin/inbox/threads/[threadId]/messages",
      method: "GET",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to load thread messages" }, { status: 500 });
  }
}
