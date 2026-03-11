import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/events/registrations", "GET");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { userId: session.user.id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
            location: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    logInfo("member_registrations_loaded", {
      pathname: "/api/events/registrations",
      method: "GET",
      status: 200,
      requestId,
      details: { count: registrations.length },
    });
    return NextResponse.json({
      registrations: registrations.map((item) => ({
        ...item,
        event: {
          ...item.event,
          startDate: item.event.startDate.toISOString(),
        },
      })),
    });
  } catch (error) {
    recordApiError("/api/events/registrations", "GET");
    logError("member_registrations_load_failed", {
      pathname: "/api/events/registrations",
      method: "GET",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to load registrations" }, { status: 500 });
  }
}
