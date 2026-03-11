import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

const DEFAULT_TEMPLATES = [
  {
    key: "registration-confirmed",
    name: "Event Registration - Confirmed",
    subject: "Registration confirmed for {{eventTitle}}",
    body: "<p>Hello {{name}},</p><p>Your registration for <strong>{{eventTitle}}</strong> is confirmed.</p><p>Status: {{status}}</p>",
  },
  {
    key: "registration-waitlisted",
    name: "Event Registration - Waitlisted",
    subject: "You're on the waitlist for {{eventTitle}}",
    body: "<p>Hello {{name}},</p><p>You are currently on the waitlist for <strong>{{eventTitle}}</strong>.</p><p>Status: {{status}}</p>",
  },
  {
    key: "registration-status-update",
    name: "Event Registration - Status Update",
    subject: "Status updated for {{eventTitle}}",
    body: "<p>Hello {{name}},</p><p>Your registration status for <strong>{{eventTitle}}</strong> is now: <strong>{{status}}</strong>.</p><p>{{note}}</p>",
  },
  {
    key: "form-submission-received",
    name: "Form Submission Received",
    subject: "Submission received: {{formTitle}}",
    body: "<p>Hello {{name}},</p><p>We received your submission for <strong>{{formTitle}}</strong>.</p>",
  },
] as const;

async function ensureDefaults() {
  for (const template of DEFAULT_TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { key: template.key },
      update: {},
      create: {
        key: template.key,
        name: template.name,
        subject: template.subject,
        body: template.body,
      },
    });
  }
}

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/email-templates", "GET");

  try {
    await ensureDefaults();
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: "asc" },
    });
    logInfo("email_templates_loaded", {
      pathname: "/api/admin/email-templates",
      method: "GET",
      status: 200,
      requestId,
      details: { count: templates.length },
    });
    return NextResponse.json({ templates });
  } catch (error) {
    recordApiError("/api/admin/email-templates", "GET");
    logError("email_templates_load_failed", {
      pathname: "/api/admin/email-templates",
      method: "GET",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/email-templates", "PUT");

  try {
    const body = await request.json();
    const templates = Array.isArray(body.templates) ? body.templates : [];

    for (const template of templates) {
      const key = typeof template.key === "string" ? template.key.trim() : "";
      const name = typeof template.name === "string" ? template.name.trim() : "";
      const subject = typeof template.subject === "string" ? template.subject : "";
      const bodyText = typeof template.body === "string" ? template.body : "";
      const enabled = template.enabled !== false;

      if (!key || !name || !subject || !bodyText) {
        return NextResponse.json({ error: "Invalid template payload" }, { status: 400 });
      }

      await prisma.emailTemplate.upsert({
        where: { key },
        update: {
          name,
          subject,
          body: bodyText,
          enabled,
        },
        create: {
          key,
          name,
          subject,
          body: bodyText,
          enabled,
        },
      });
    }

    const updated = await prisma.emailTemplate.findMany({ orderBy: { name: "asc" } });
    logInfo("email_templates_updated", {
      pathname: "/api/admin/email-templates",
      method: "PUT",
      status: 200,
      requestId,
      details: { count: updated.length },
    });
    return NextResponse.json({ templates: updated });
  } catch (error) {
    recordApiError("/api/admin/email-templates", "PUT");
    logError("email_templates_update_failed", {
      pathname: "/api/admin/email-templates",
      method: "PUT",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to update templates" }, { status: 500 });
  }
}
