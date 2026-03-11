import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMetricsSnapshot, recordApiError, recordApiRequest } from "@/lib/metrics";
import { logError, logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/health", "GET");
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const payload = {
      ok: true,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - getMetricsSnapshot().startedAt) / 1000),
      checks: {
        database: "ok",
      },
    };
    logInfo("health_check_ok", {
      pathname: "/api/health",
      method: "GET",
      status: 200,
      requestId,
      details: { durationMs: Date.now() - startedAt },
    });
    return NextResponse.json(payload);
  } catch {
    recordApiError("/api/health", "GET");
    logError("health_check_failed", {
      pathname: "/api/health",
      method: "GET",
      status: 503,
      requestId,
      details: { durationMs: Date.now() - startedAt },
    });
    return NextResponse.json(
      {
        ok: false,
        timestamp: new Date().toISOString(),
        error: "database_unavailable",
        checks: {
          database: "failed",
        },
      },
      { status: 503 }
    );
  }
}
