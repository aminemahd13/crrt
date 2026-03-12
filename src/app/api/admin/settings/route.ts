import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";
import { getDefaultPlatformSettings } from "@/lib/site-config";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/settings", "GET");
  try {
    const settings = await prisma.platformSettings.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        ...getDefaultPlatformSettings(),
      },
    });
    logInfo("settings_loaded", {
      pathname: "/api/admin/settings",
      method: "GET",
      status: 200,
      requestId,
    });
    return NextResponse.json(settings);
  } catch (error) {
    recordApiError("/api/admin/settings", "GET");
    logError("settings_load_failed", {
      pathname: "/api/admin/settings",
      method: "GET",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/settings", "PUT");
  try {
    const body = await request.json();
    const siteTitle = typeof body.siteTitle === "string" ? body.siteTitle.trim() : "";
    const siteUrl = typeof body.siteUrl === "string" ? body.siteUrl.trim() : "";

    if (!siteTitle || !siteUrl) {
      return NextResponse.json({ error: "siteTitle and siteUrl are required" }, { status: 400 });
    }

    const updated = await prisma.platformSettings.upsert({
      where: { id: "default" },
      update: {
        siteTitle,
        siteUrl,
        adminEmail: typeof body.adminEmail === "string" ? body.adminEmail.trim() : null,
        smtpHost: typeof body.smtpHost === "string" ? body.smtpHost.trim() : null,
        smtpPort: Number.isFinite(body.smtpPort) ? Number(body.smtpPort) : null,
        smtpFrom: typeof body.smtpFrom === "string" ? body.smtpFrom.trim() : null,
      },
      create: {
        id: "default",
        siteTitle,
        siteUrl,
        adminEmail: typeof body.adminEmail === "string" ? body.adminEmail.trim() : null,
        smtpHost: typeof body.smtpHost === "string" ? body.smtpHost.trim() : null,
        smtpPort: Number.isFinite(body.smtpPort) ? Number(body.smtpPort) : null,
        smtpFrom: typeof body.smtpFrom === "string" ? body.smtpFrom.trim() : null,
      },
    });

    logInfo("settings_updated", {
      pathname: "/api/admin/settings",
      method: "PUT",
      status: 200,
      requestId,
    });
    return NextResponse.json(updated);
  } catch (error) {
    recordApiError("/api/admin/settings", "PUT");
    logError("settings_update_failed", {
      pathname: "/api/admin/settings",
      method: "PUT",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
