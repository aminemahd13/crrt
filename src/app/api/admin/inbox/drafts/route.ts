import { NextResponse } from "next/server";
import { createMailboxDraft, listMailboxDrafts, parseDraftPayload } from "@/lib/mailbox";
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
  recordApiRequest("/api/admin/inbox/drafts", "GET");
  try {
    const url = new URL(request.url);
    const page = toPositiveInteger(url.searchParams.get("page"), 1);
    const pageSize = Math.min(50, toPositiveInteger(url.searchParams.get("pageSize"), 20));
    const q = (url.searchParams.get("q") ?? "").trim();

    const payload = await listMailboxDrafts({ page, pageSize, query: q });
    return NextResponse.json(payload);
  } catch (error) {
    recordApiError("/api/admin/inbox/drafts", "GET");
    logError("admin_inbox_drafts_list_failed", {
      pathname: "/api/admin/inbox/drafts",
      method: "GET",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to load drafts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/drafts", "POST");
  try {
    const body = await request.json();
    const payload = parseDraftPayload(body);
    const draft = await createMailboxDraft(payload);
    logInfo("admin_inbox_draft_created", {
      pathname: "/api/admin/inbox/drafts",
      method: "POST",
      status: 201,
      requestId,
      details: { draftId: draft.id },
    });
    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /invalid|required|attachments|conflict/i.test(message) ? 400 : 500;
    if (status === 500) {
      recordApiError("/api/admin/inbox/drafts", "POST");
    }
    logError("admin_inbox_draft_create_failed", {
      pathname: "/api/admin/inbox/drafts",
      method: "POST",
      status,
      requestId,
      details: { message },
    });
    return NextResponse.json({ error: message }, { status });
  }
}
