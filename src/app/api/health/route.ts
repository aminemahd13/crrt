import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        timestamp: new Date().toISOString(),
        error: "database_unavailable",
      },
      { status: 503 }
    );
  }
}
