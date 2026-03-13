import { NextResponse } from "next/server";
import { deleteMailboxDraft, getMailboxDraft, parseDraftPayload, updateMailboxDraft } from "@/lib/mailbox";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/drafts/[id]", "GET");
  try {
    const { id } = await params;
    const draft = await getMailboxDraft(id);
    return NextResponse.json(draft);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /not found/i.test(message) ? 404 : 500;
    if (status === 500) {
      recordApiError("/api/admin/inbox/drafts/[id]", "GET");
    }
    logError("admin_inbox_draft_get_failed", {
      pathname: "/api/admin/inbox/drafts/[id]",
      method: "GET",
      status,
      requestId,
      details: { message },
    });
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/drafts/[id]", "PUT");
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = parseDraftPayload(body);
    const version = Number.parseInt(String(body.version ?? ""), 10);
    if (!Number.isFinite(version) || version <= 0) {
      return NextResponse.json({ error: "A valid draft version is required." }, { status: 400 });
    }

    const draft = await updateMailboxDraft(id, payload, version);
    logInfo("admin_inbox_draft_updated", {
      pathname: "/api/admin/inbox/drafts/[id]",
      method: "PUT",
      status: 200,
      requestId,
      details: { draftId: id, version: draft.version },
    });
    return NextResponse.json(draft);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    let status = 500;
    if (/not found/i.test(message)) status = 404;
    else if (/conflict|version/i.test(message)) status = 409;
    else if (/invalid|required|attachments/i.test(message)) status = 400;

    if (status === 500) {
      recordApiError("/api/admin/inbox/drafts/[id]", "PUT");
    }
    logError("admin_inbox_draft_update_failed", {
      pathname: "/api/admin/inbox/drafts/[id]",
      method: "PUT",
      status,
      requestId,
      details: { message },
    });
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/drafts/[id]", "DELETE");
  try {
    const { id } = await params;
    await deleteMailboxDraft(id);
    logInfo("admin_inbox_draft_deleted", {
      pathname: "/api/admin/inbox/drafts/[id]",
      method: "DELETE",
      status: 200,
      requestId,
      details: { draftId: id },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    recordApiError("/api/admin/inbox/drafts/[id]", "DELETE");
    logError("admin_inbox_draft_delete_failed", {
      pathname: "/api/admin/inbox/drafts/[id]",
      method: "DELETE",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
  }
}
