import { NextResponse } from "next/server";
import { getMailboxAttachmentContent } from "@/lib/mailbox";
import { logError } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/inbox/attachments/[id]", "GET");
  try {
    const { id } = await params;
    const attachment = await getMailboxAttachmentContent(id);
    return new NextResponse(attachment.content, {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": String(attachment.size),
        "Content-Disposition": `attachment; filename=\"${attachment.filename}\"`,
      },
    });
  } catch (error) {
    recordApiError("/api/admin/inbox/attachments/[id]", "GET");
    logError("admin_inbox_attachment_failed", {
      pathname: "/api/admin/inbox/attachments/[id]",
      method: "GET",
      status: 404,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }
}
