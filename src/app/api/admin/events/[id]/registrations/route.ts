import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

function toCsv(rows: Array<Record<string, string>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    const cells = headers.map((header) => {
      const value = row[header] ?? "";
      const escaped = value.replace(/"/g, "\"\"");
      return `"${escaped}"`;
    });
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/events/[id]/registrations", "GET");

  try {
    const { id } = await params;
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const format = url.searchParams.get("format");

    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId: id,
        ...(status ? { status: status as never } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      const csvRows = registrations.map((item) => ({
        registrationId: item.id,
        eventTitle: item.event.title,
        userName: item.user.name || "",
        userEmail: item.user.email || "",
        status: item.status,
        note: item.note || "",
        createdAt: item.createdAt.toISOString(),
      }));
      const csv = toCsv(csvRows);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="event-${id}-registrations.csv"`,
        },
      });
    }

    logInfo("admin_event_registrations_loaded", {
      pathname: "/api/admin/events/[id]/registrations",
      method: "GET",
      status: 200,
      requestId,
      details: { eventId: id, count: registrations.length },
    });

    return NextResponse.json({
      registrations: registrations.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        waitlistedAt: item.waitlistedAt?.toISOString() ?? null,
        approvedAt: item.approvedAt?.toISOString() ?? null,
        rejectedAt: item.rejectedAt?.toISOString() ?? null,
        cancelledAt: item.cancelledAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    recordApiError("/api/admin/events/[id]/registrations", "GET");
    logError("admin_event_registrations_load_failed", {
      pathname: "/api/admin/events/[id]/registrations",
      method: "GET",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to load registrations" }, { status: 500 });
  }
}
