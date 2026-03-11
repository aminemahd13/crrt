import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/resources/private", "GET");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resources = await prisma.resource.findMany({
      where: { isPublic: false },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    logInfo("private_resources_loaded", {
      pathname: "/api/resources/private",
      method: "GET",
      status: 200,
      requestId,
      details: { count: resources.length },
    });

    return NextResponse.json({
      resources: resources.map((resource) => ({
        ...resource,
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    recordApiError("/api/resources/private", "GET");
    logError("private_resources_load_failed", {
      pathname: "/api/resources/private",
      method: "GET",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to load private resources" }, { status: 500 });
  }
}
