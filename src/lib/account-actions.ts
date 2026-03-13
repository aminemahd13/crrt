import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getPlatformSettingsSnapshot } from "@/lib/site-config";
import { sendTemplatedEmail } from "@/lib/email";

export const ACCOUNT_ACTION = {
  PASSWORD_RESET: "password_reset",
  EMAIL_VERIFY: "email_verify",
  EMAIL_CHANGE: "email_change",
} as const;

export type AccountActionType = (typeof ACCOUNT_ACTION)[keyof typeof ACCOUNT_ACTION];

interface IssueTokenInput {
  userId: string;
  action: AccountActionType;
  pendingEmail?: string | null;
  ttlMinutes?: number;
}

interface ConsumeTokenInput {
  action: AccountActionType;
  token: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) return "http://localhost:3300";
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, "");
  }
  return `https://${trimmed}`.replace(/\/$/, "");
}

async function buildActionUrl(pathname: string, token: string): Promise<string> {
  const settings = await getPlatformSettingsSnapshot();
  const siteUrl = normalizeUrl(settings.siteUrl);
  const url = new URL(pathname, siteUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

const EMAIL_ACTION_LINK_STYLE = [
  "display:inline-block",
  "padding:12px 18px",
  "border-radius:8px",
  "background:#f97316",
  "color:#ffffff",
  "font-weight:600",
  "text-decoration:none",
  "font-family:Arial,sans-serif",
].join(";");

const EMAIL_RAW_LINK_STYLE = [
  "color:#f97316",
  "text-decoration:underline",
  "word-break:break-all",
  "font-family:Arial,sans-serif",
].join(";");

function buildActionEmailBody(input: {
  intro: string;
  ctaLabel: string;
  urlVariable: "resetUrl" | "verifyUrl";
  expiryText: string;
}): string {
  const urlPlaceholder = `{{${input.urlVariable}}}`;

  return [
    "<p>Hello {{name}},</p>",
    `<p>${input.intro}</p>`,
    `<p><a href="${urlPlaceholder}" style="${EMAIL_ACTION_LINK_STYLE}" target="_blank" rel="noopener noreferrer">${input.ctaLabel}</a></p>`,
    `<p>${input.expiryText}</p>`,
    '<p style="margin-top:20px;font-size:12px;color:#64748b;font-family:Arial,sans-serif;">If the button is not clickable, copy and paste this link into your browser:</p>',
    `<p><a href="${urlPlaceholder}" style="${EMAIL_RAW_LINK_STYLE}" target="_blank" rel="noopener noreferrer">${urlPlaceholder}</a></p>`,
  ].join("");
}

export async function issueAccountActionToken(input: IssueTokenInput): Promise<string> {
  const ttlMinutes = Number.isFinite(input.ttlMinutes) ? Math.max(1, input.ttlMinutes ?? 0) : 60;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
  const plainToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(plainToken);

  await prisma.accountActionToken.create({
    data: {
      userId: input.userId,
      action: input.action,
      tokenHash,
      pendingEmail: input.pendingEmail ?? null,
      expiresAt,
    },
  });

  return plainToken;
}

export async function consumeAccountActionToken(input: ConsumeTokenInput) {
  const tokenHash = hashToken(input.token);
  const now = new Date();

  const existing = await prisma.accountActionToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
        },
      },
    },
  });

  if (!existing || existing.action !== input.action) return null;
  if (existing.consumedAt || existing.expiresAt <= now) return null;

  const consumeResult = await prisma.accountActionToken.updateMany({
    where: {
      id: existing.id,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    data: {
      consumedAt: now,
    },
  });

  if (consumeResult.count !== 1) return null;
  return existing;
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string | null;
  token: string;
}) {
  const resetUrl = await buildActionUrl("/reset-password", params.token);
  const displayName = params.name || "there";

  return sendTemplatedEmail({
    key: "auth_password_reset",
    to: params.to,
    variables: {
      name: displayName,
      resetUrl,
    },
    fallbackSubject: "Reset your CRRT password",
    fallbackBody: buildActionEmailBody({
      intro: "You requested a password reset for your CRRT account.",
      ctaLabel: "Reset your password",
      urlVariable: "resetUrl",
      expiryText: "This link expires in 1 hour.",
    }),
  });
}

export async function sendEmailVerificationEmail(params: {
  to: string;
  name: string | null;
  token: string;
}) {
  const verifyUrl = await buildActionUrl("/verify-email", params.token);
  const displayName = params.name || "there";

  return sendTemplatedEmail({
    key: "auth_email_verification",
    to: params.to,
    variables: {
      name: displayName,
      verifyUrl,
    },
    fallbackSubject: "Verify your CRRT email",
    fallbackBody: buildActionEmailBody({
      intro: "Please verify your email to activate your CRRT account actions.",
      ctaLabel: "Verify email",
      urlVariable: "verifyUrl",
      expiryText: "This link expires in 24 hours.",
    }),
  });
}

export async function sendEmailChangeVerificationEmail(params: {
  to: string;
  name: string | null;
  token: string;
}) {
  const verifyUrl = await buildActionUrl("/verify-email", params.token);
  const displayName = params.name || "there";

  return sendTemplatedEmail({
    key: "auth_email_change_verification",
    to: params.to,
    variables: {
      name: displayName,
      verifyUrl,
    },
    fallbackSubject: "Confirm your new email",
    fallbackBody: buildActionEmailBody({
      intro: "We received a request to change your CRRT account email.",
      ctaLabel: "Confirm new email",
      urlVariable: "verifyUrl",
      expiryText: "This link expires in 24 hours.",
    }),
  });
}
