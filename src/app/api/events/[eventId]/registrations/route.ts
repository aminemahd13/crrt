import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest, recordRegistrationCreated } from "@/lib/metrics";
import { ACTIVE_REGISTRATION_STATUSES, nextRegistrationStatus } from "@/lib/event-registration";
import { sendTemplatedEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/events/[eventId]/registrations", "POST");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { eventId } = await params;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        slug: true,
        registrationMode: true,
        capacity: true,
      },
    });
    if (!event || event.registrationMode !== "internal") {
      return NextResponse.json({ error: "Event does not support internal registration" }, { status: 400 });
    }

    const activeCount = await prisma.eventRegistration.count({
      where: {
        eventId,
        status: { in: ACTIVE_REGISTRATION_STATUSES },
      },
    });
    const status = nextRegistrationStatus(event.capacity, activeCount);
    const now = new Date();

    const existing = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id,
        },
      },
    });

    const registration = existing
      ? await prisma.eventRegistration.update({
          where: { id: existing.id },
          data: {
            status,
            note: null,
            waitlistedAt: status === "waitlisted" ? now : null,
            approvedAt: status === "approved" ? now : null,
            rejectedAt: null,
            cancelledAt: null,
          },
        })
      : await prisma.eventRegistration.create({
          data: {
            eventId,
            userId: session.user.id,
            status,
            waitlistedAt: status === "waitlisted" ? now : null,
          },
        });

    recordRegistrationCreated(status);

    if (session.user.email) {
      const statusLabel = status === "waitlisted" ? "waitlisted" : "confirmed";
      await sendTemplatedEmail({
        key: status === "waitlisted" ? "registration-waitlisted" : "registration-confirmed",
        to: session.user.email,
        variables: {
          name: session.user.name || session.user.email,
          eventTitle: event.title,
          status: statusLabel,
          note: "",
        },
        fallbackSubject:
          status === "waitlisted"
            ? "You are on the waitlist for {{eventTitle}}"
            : "Registration confirmed for {{eventTitle}}",
        fallbackBody:
          status === "waitlisted"
            ? "<p>Hello {{name}}, you are currently on the waitlist for <strong>{{eventTitle}}</strong>.</p>"
            : "<p>Hello {{name}}, your registration for <strong>{{eventTitle}}</strong> is confirmed.</p>",
      });
    }

    logInfo("event_registration_upserted", {
      pathname: "/api/events/[eventId]/registrations",
      method: "POST",
      status: 201,
      requestId,
      details: { eventId, userId: session.user.id, registrationStatus: status },
    });

    return NextResponse.json(registration, { status: existing ? 200 : 201 });
  } catch (error) {
    recordApiError("/api/events/[eventId]/registrations", "POST");
    logError("event_registration_failed", {
      pathname: "/api/events/[eventId]/registrations",
      method: "POST",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to register for event" }, { status: 500 });
  }
}
