import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/admin/email/send
 * Send an email via the configured SMTP transport.
 */
export async function POST(request: Request) {
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
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Email sent successfully" });
}
