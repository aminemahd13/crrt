import { NextResponse } from "next/server";
import { metricsAsPrometheus } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const body = metricsAsPrometheus();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/plain; version=0.0.4; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
