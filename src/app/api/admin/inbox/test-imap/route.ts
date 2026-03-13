import { NextResponse } from "next/server";
import { verifyImapConnection } from "@/lib/mailbox";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/test-imap", "POST");
  try {
    const result = await verifyImapConnection();
    if (!result.ok) {
      recordApiError("/api/admin/inbox/test-imap", "POST");
      return NextResponse.json({ error: result.error ?? "IMAP connection failed" }, { status: 500 });
    }
    logInfo("admin_inbox_imap_test_ok", {
      pathname: "/api/admin/inbox/test-imap",
      method: "POST",
      status: 200,
      requestId,
      details: result.details,
    });
    return NextResponse.json({ ok: true, details: result.details });
  } catch (error) {
    recordApiError("/api/admin/inbox/test-imap", "POST");
    logError("admin_inbox_imap_test_failed", {
      pathname: "/api/admin/inbox/test-imap",
      method: "POST",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to verify IMAP configuration" }, { status: 500 });
  }
}
