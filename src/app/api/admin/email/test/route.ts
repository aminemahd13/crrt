import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

/**
 * POST /api/admin/email/test
 * Send a test email to verify SMTP configuration.
 */
export async function POST(request: Request) {
    const requestId = request.headers.get("x-request-id");
    recordApiRequest("/api/admin/email/test", "POST");
    const body = await request.json();
    const { to } = body;

    if (!to) {
        return NextResponse.json(
            { error: "Missing recipient email address" },
            { status: 400 }
        );
    }

    const result = await sendEmail({
        to,
        subject: "CRRT Platform — SMTP Test",
        html: `
      <div style="font-family: system-ui, sans-serif; padding: 20px; background: #0F172A; color: #F8FAFC; border-radius: 12px;">
        <h2 style="color: #F97316; margin-bottom: 8px;">✅ SMTP Test Successful</h2>
        <p style="color: #94A3B8; margin: 0;">Your SMTP configuration is working correctly.</p>
        <hr style="border-color: rgba(248,250,252,0.08); margin: 16px 0;" />
        <p style="color: #64748B; font-size: 12px; margin: 0;">
          Sent from CRRT Platform at ${new Date().toLocaleString()}
        </p>
      </div>
    `,
    });

    if (!result.ok) {
        recordApiError("/api/admin/email/test", "POST");
        logError("email_test_failed", {
            pathname: "/api/admin/email/test",
            method: "POST",
            status: 500,
            requestId,
            details: { to, error: result.error },
        });
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    logInfo("email_test_sent", {
        pathname: "/api/admin/email/test",
        method: "POST",
        status: 200,
        requestId,
        details: { to },
    });
    return NextResponse.json({ ok: true, message: "Test email sent" });
}
