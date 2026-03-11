import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

/**
 * POST /api/admin/email/send
 * Send an email via the configured SMTP transport.
 */
export async function POST(request: Request) {
    const requestId = request.headers.get("x-request-id");
    recordApiRequest("/api/admin/email/send", "POST");
    const body = await request.json();
    const { to, subject, html } = body;

    if (!to || !subject || !html) {
        return NextResponse.json(
            { error: "Missing required fields: to, subject, html" },
            { status: 400 }
        );
    }

    const result = await sendEmail({ to, subject, html });

    if (!result.ok) {
        recordApiError("/api/admin/email/send", "POST");
        logError("email_send_failed", {
            pathname: "/api/admin/email/send",
            method: "POST",
            status: 500,
            requestId,
            details: { to, subject, error: result.error },
        });
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    logInfo("email_sent", {
        pathname: "/api/admin/email/send",
        method: "POST",
        status: 200,
        requestId,
        details: { to, subject },
    });
    return NextResponse.json({ ok: true, message: "Email sent successfully" });
}
