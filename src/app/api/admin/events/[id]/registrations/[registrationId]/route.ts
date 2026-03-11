import { NextResponse } from "next/server";
import type { EventRegistrationStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTemplatedEmail } from "@/lib/email";
import { logError, logInfo } from "@/lib/logger";
import {
  recordApiError,
  recordApiRequest,
  recordApplicationAction,
  recordApplicationFailure,
} from "@/lib/metrics";

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

    const existing = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
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

    const session = await getServerSession(authOptions);
    recordApplicationAction("registration_update");
    logInfo("admin_event_registration_updated", {
      pathname: "/api/admin/events/[id]/registrations/[registrationId]",
      method: "PUT",
      status: 200,
      requestId,
      details: {
        registrationId,
        actorId: session?.user?.id ?? null,
        actorEmail: session?.user?.email ?? null,
        beforeStatus: existing.status,
        afterStatus: status,
      },
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
    recordApplicationFailure("registration_update");
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/events/[id]/registrations/[registrationId]", "DELETE");

  try {
    const { id, registrationId } = await params;
    const existing = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        eventId: true,
      },
    });

    if (!existing) {
      return NextResponse.json({
        ok: true,
        deleted: {
          registrationId: null,
          submissionId: null,
        },
      });
    }

    if (existing.eventId !== id) {
      return NextResponse.json({ error: "Registration not found for this event" }, { status: 404 });
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const linkedSubmission = await tx.formSubmission.findUnique({
        where: {
          eventRegistrationId: registrationId,
        },
        select: {
          id: true,
        },
      });

      let deletedSubmissionId: string | null = null;
      if (linkedSubmission) {
        await tx.formSubmission.delete({ where: { id: linkedSubmission.id } });
        deletedSubmissionId = linkedSubmission.id;
      }

      await tx.eventRegistration.delete({ where: { id: registrationId } });

      return {
        deletedRegistrationId: registrationId,
        deletedSubmissionId,
      };
    });

    const session = await getServerSession(authOptions);
    recordApplicationAction("registration_delete");
    logInfo("admin_event_registration_deleted", {
      pathname: "/api/admin/events/[id]/registrations/[registrationId]",
      method: "DELETE",
      status: 200,
      requestId,
      details: {
        eventId: id,
        registrationId: deleted.deletedRegistrationId,
        submissionId: deleted.deletedSubmissionId,
        actorId: session?.user?.id ?? null,
        actorEmail: session?.user?.email ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      deleted: {
        registrationId: deleted.deletedRegistrationId,
        submissionId: deleted.deletedSubmissionId,
      },
    });
  } catch (error) {
    recordApiError("/api/admin/events/[id]/registrations/[registrationId]", "DELETE");
    recordApplicationFailure("registration_delete");
    logError("admin_event_registration_delete_failed", {
      pathname: "/api/admin/events/[id]/registrations/[registrationId]",
      method: "DELETE",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to delete registration" }, { status: 500 });
  }
}
