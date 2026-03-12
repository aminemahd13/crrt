import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { getPlatformSettingsSnapshot } from "@/lib/site-config";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

async function resolveSmtpConfig() {
  const settings = await getPlatformSettingsSnapshot();
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fallbackFrom = process.env.SMTP_USER ? `CRRT <${process.env.SMTP_USER}>` : "CRRT <no-reply@localhost>";

  return {
    host: settings.smtpHost,
    port: settings.smtpPort,
    user,
    pass,
    from: settings.smtpFrom || fallbackFrom,
  };
}

export async function sendEmail(opts: EmailOptions): Promise<{ ok: boolean; error?: string }> {
  const smtp = await resolveSmtpConfig();

  const host = smtp.host.trim();
  const user = smtp.user?.trim();
  const pass = smtp.pass?.trim();

  if (!host || !user || !pass) {
    console.log("[Email Preview - SMTP not configured]");
    console.log(`   To: ${opts.to}`);
    console.log(`   Subject: ${opts.subject}`);
    console.log(`   Body: ${opts.html.slice(0, 200)}...`);
    return { ok: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: opts.from || smtp.from,
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
