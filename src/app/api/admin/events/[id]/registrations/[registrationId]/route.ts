import { NextResponse } from "next/server";
import type { EventRegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendTemplatedEmail } from "@/lib/email";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

const ALLOWED_STATUSES: EventRegistrationStatus[] = [
  "registered",
  "waitlisted",
  "approved",
  "rejected",
  "cancelled",
];

function toTimestampUpdate(status: EventRegistrationStatus) {
  const now = new Date();
  return {
    waitlistedAt: status === "waitlisted" ? now : null,
    approvedAt: status === "approved" ? now : null,
    rejectedAt: status === "rejected" ? now : null,
    cancelledAt: status === "cancelled" ? now : null,
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/events/[id]/registrations/[registrationId]", "PUT");

  try {
    const { registrationId } = await params;
    const body = await request.json();
    const status = body.status as EventRegistrationStatus;
    const note = typeof body.note === "string" ? body.note.trim() : null;

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid registration status" }, { status: 400 });
    }

    const updated = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        status,
        note,
        ...toTimestampUpdate(status),
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        event: {
          select: {
            title: true,
          },
        },
      },
    });

    if (updated.user.email) {
      await sendTemplatedEmail({
        key: "registration-status-update",
        to: updated.user.email,
        variables: {
          name: updated.user.name || updated.user.email,
          eventTitle: updated.event.title,
          status,
          note: note || "",
        },
        fallbackSubject: "Status updated for {{eventTitle}}",
        fallbackBody:
          "<p>Hello {{name}}, your registration status for <strong>{{eventTitle}}</strong> is now: <strong>{{status}}</strong>.</p><p>{{note}}</p>",
      });
    }

    logInfo("admin_event_registration_updated", {
      pathname: "/api/admin/events/[id]/registrations/[registrationId]",
      method: "PUT",
      status: 200,
      requestId,
      details: { registrationId, status },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      waitlistedAt: updated.waitlistedAt?.toISOString() ?? null,
      approvedAt: updated.approvedAt?.toISOString() ?? null,
      rejectedAt: updated.rejectedAt?.toISOString() ?? null,
      cancelledAt: updated.cancelledAt?.toISOString() ?? null,
    });
  } catch (error) {
    recordApiError("/api/admin/events/[id]/registrations/[registrationId]", "PUT");
    logError("admin_event_registration_update_failed", {
      pathname: "/api/admin/events/[id]/registrations/[registrationId]",
      method: "PUT",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
  }
}
