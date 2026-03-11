import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCancelRegistration } from "@/lib/event-registration";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/events/registrations/[id]", "DELETE");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const registration = await prisma.eventRegistration.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });
    if (!registration || registration.userId !== session.user.id) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    if (!canCancelRegistration(registration.status)) {
      return NextResponse.json({ error: "Registration cannot be cancelled from current status" }, { status: 400 });
    }

    const updated = await prisma.eventRegistration.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    });

    logInfo("event_registration_cancelled", {
      pathname: "/api/events/registrations/[id]",
      method: "DELETE",
      status: 200,
      requestId,
      details: { registrationId: id, userId: session.user.id },
    });
    return NextResponse.json(updated);
  } catch (error) {
    recordApiError("/api/events/registrations/[id]", "DELETE");
    logError("event_registration_cancel_failed", {
      pathname: "/api/events/registrations/[id]",
      method: "DELETE",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to cancel registration" }, { status: 500 });
  }
}
