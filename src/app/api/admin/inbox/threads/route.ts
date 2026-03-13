import { NextResponse } from "next/server";
import { listInboxThreads } from "@/lib/mailbox";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export const runtime = "nodejs";

function toPositiveInteger(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/threads", "GET");
  try {
    const url = new URL(request.url);
    const folder = (url.searchParams.get("folder") ?? "inbox").toLowerCase();
    if (!["inbox", "sent", "archive", "trash"].includes(folder)) {
      return NextResponse.json({ error: "Invalid folder for thread listing." }, { status: 400 });
    }
    const page = toPositiveInteger(url.searchParams.get("page"), 1);
    const pageSize = Math.min(100, toPositiveInteger(url.searchParams.get("pageSize"), 25));
    const q = (url.searchParams.get("q") ?? "").trim();
    const unreadOnly = (url.searchParams.get("unreadOnly") ?? "false").toLowerCase() === "true";

    const payload = await listInboxThreads({
      folderKey: folder as "inbox" | "sent" | "archive" | "trash",
      page,
      pageSize,
      query: q,
      unreadOnly,
    });

    logInfo("admin_inbox_threads_loaded", {
      pathname: "/api/admin/inbox/threads",
      method: "GET",
      status: 200,
      requestId,
      details: {
        folder,
        page,
        pageSize,
        query: q,
      },
    });
    return NextResponse.json(payload);
  } catch (error) {
    recordApiError("/api/admin/inbox/threads", "GET");
    logError("admin_inbox_threads_failed", {
      pathname: "/api/admin/inbox/threads",
      method: "GET",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to load inbox threads" }, { status: 500 });
  }
}
