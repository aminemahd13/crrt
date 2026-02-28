import nodemailer from "nodemailer";

/**
 * SMTP email sending service.
 * Reads config from environment variables.
 * Falls back to console logging if SMTP is not configured.
 */

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

function getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
}

export async function sendEmail(opts: EmailOptions): Promise<{ ok: boolean; error?: string }> {
    const transporter = getTransporter();

    if (!transporter) {
        // Log to console when SMTP is not configured (dev mode)
        console.log(`📧 [Email Preview — SMTP not configured]`);
        console.log(`   To: ${opts.to}`);
        console.log(`   Subject: ${opts.subject}`);
        console.log(`   Body: ${opts.html.slice(0, 200)}...`);
        return { ok: true };
    }

    try {
        await transporter.sendMail({
            from: opts.from || process.env.SMTP_FROM || `CRRT <${process.env.SMTP_USER}>`,
            to: opts.to,
            subject: opts.subject,
            html: opts.html,
        });
        return { ok: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`❌ Email send failed: ${message}`);
        return { ok: false, error: message };
    }
}

/**
 * Renders an email template by replacing {{variable}} placeholders
 * with the provided values.
 */
export function renderTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        result = result.replaceAll(`{{${key}}}`, value);
    }
    return result;
}
