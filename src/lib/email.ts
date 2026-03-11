import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT || "587", 10);
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
    console.log("[Email Preview - SMTP not configured]");
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
    console.error(`Email send failed: ${message}`);
    return { ok: false, error: message };
  }
}

export function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

interface TemplatedEmailInput {
  key: string;
  to: string;
  variables: Record<string, string>;
  fallbackSubject: string;
  fallbackBody: string;
}

export async function sendTemplatedEmail(
  input: TemplatedEmailInput
): Promise<{ ok: boolean; error?: string }> {
  const template = await prisma.emailTemplate.findUnique({
    where: { key: input.key },
  });

  if (template && template.enabled) {
    return sendEmail({
      to: input.to,
      subject: renderTemplate(template.subject, input.variables),
      html: renderTemplate(template.body, input.variables),
    });
  }

  return sendEmail({
    to: input.to,
    subject: renderTemplate(input.fallbackSubject, input.variables),
    html: renderTemplate(input.fallbackBody, input.variables),
  });
}
