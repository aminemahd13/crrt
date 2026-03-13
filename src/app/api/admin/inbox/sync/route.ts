import { NextResponse } from "next/server";
import { getMailboxStatus, syncMailbox } from "@/lib/mailbox";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/sync", "GET");
  try {
    const status = await getMailboxStatus();
    return NextResponse.json(status);
  } catch (error) {
    recordApiError("/api/admin/inbox/sync", "GET");
    logError("admin_inbox_status_failed", {
      pathname: "/api/admin/inbox/sync",
      method: "GET",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to load inbox status" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/sync", "POST");
  try {
    const body = await request.json().catch(() => ({}));
    const folderKey = typeof body.folderKey === "string" ? body.folderKey : undefined;
    if (folderKey && !["inbox", "sent", "drafts", "archive", "trash"].includes(folderKey)) {
      return NextResponse.json({ error: "Invalid folder key." }, { status: 400 });
    }
    const result = await syncMailbox({
      folderKey: folderKey as "inbox" | "sent" | "drafts" | "archive" | "trash" | undefined,
    });

    if (!result.ok && !result.locked) {
      recordApiError("/api/admin/inbox/sync", "POST");
      return NextResponse.json(result, { status: 500 });
    }

    logInfo("admin_inbox_sync_completed", {
      pathname: "/api/admin/inbox/sync",
      method: "POST",
      status: result.locked ? 409 : 200,
      requestId,
      details: result,
    });
    return NextResponse.json(result, { status: result.locked ? 409 : 200 });
  } catch (error) {
    recordApiError("/api/admin/inbox/sync", "POST");
    logError("admin_inbox_sync_failed", {
      pathname: "/api/admin/inbox/sync",
      method: "POST",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to sync inbox" }, { status: 500 });
  }
}
