import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, sendTemplatedEmail } from "@/lib/email";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/forms/submit", "POST");

  try {
    const body = await request.json();
    const formId = body.formId as string | undefined;
    const data =
      body.data && typeof body.data === "object" && !Array.isArray(body.data)
        ? (JSON.parse(JSON.stringify(body.data)) as Prisma.InputJsonObject)
        : null;

    if (!formId || !data) {
      return NextResponse.json({ error: "Missing formId or data" }, { status: 400 });
    }

    const form = await prisma.form.findUnique({ where: { id: formId } });
    if (!form || form.status !== "published") {
      return NextResponse.json({ error: "Form not found or not published" }, { status: 404 });
    }

    const submission = await prisma.formSubmission.create({
      data: {
        formId,
        data,
        status: "new",
      },
    });

    const submitterEmail = typeof data.email === "string" ? data.email : undefined;
    if (submitterEmail) {
      await sendTemplatedEmail({
        key: "form-submission-received",
        to: submitterEmail,
        variables: {
          name: submitterEmail,
          formTitle: form.title,
          submissionId: submission.id,
        },
        fallbackSubject: "Submission received: {{formTitle}}",
        fallbackBody:
          "<p>Hello {{name}},</p><p>We received your submission for <strong>{{formTitle}}</strong>.</p><p>Submission ID: {{submissionId}}</p>",
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      const summary = Object.entries(data)
        .map(([key, value]) => `<strong>${key}</strong>: ${String(value ?? "")}`)
        .join("<br/>");

      await sendEmail({
        to: adminEmail,
        subject: `New submission: ${form.title}`,
        html: `
          <div style="font-family: system-ui, sans-serif; padding: 24px; background: #0F172A; color: #F8FAFC; border-radius: 12px;">
            <h2 style="color: #F97316; margin-bottom: 8px;">New Form Submission</h2>
            <p style="color: #94A3B8; margin: 4px 0;"><strong>Form:</strong> ${form.title}</p>
            <p style="color: #94A3B8; margin: 4px 0;"><strong>Status:</strong> New</p>
            <hr style="border-color: rgba(248,250,252,0.08); margin: 16px 0;" />
            <div style="color: #94A3B8; font-size: 14px; line-height: 1.6;">${summary}</div>
          </div>
        `,
      });
    }

    logInfo("form_submission_created", {
      pathname: "/api/forms/submit",
      method: "POST",
      status: 201,
      requestId,
      details: { formId, submissionId: submission.id },
    });
    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    recordApiError("/api/forms/submit", "POST");
    logError("form_submission_failed", {
      pathname: "/api/forms/submit",
      method: "POST",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to submit form" }, { status: 500 });
  }
}
