import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_ACTION,
  issueAccountActionToken,
  sendEmailChangeVerificationEmail,
} from "@/lib/account-actions";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ChangeEmailPayload {
  email?: unknown;
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ChangeEmailPayload;
  const nextEmail = normalizeEmail(body.email);

  if (!nextEmail || !EMAIL_REGEX.test(nextEmail)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const [user, existing] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    }),
    prisma.user.findUnique({
      where: { email: nextEmail },
      select: { id: true },
    }),
  ]);

  if (!user?.email) {
    return NextResponse.json({ error: "User email unavailable." }, { status: 400 });
  }

  if (existing && existing.id !== user.id) {
    return NextResponse.json({ error: "This email is already in use." }, { status: 409 });
  }

  if (user.email.toLowerCase() === nextEmail) {
    return NextResponse.json({ error: "This is already your current email." }, { status: 400 });
  }

  const token = await issueAccountActionToken({
    userId: user.id,
    action: ACCOUNT_ACTION.EMAIL_CHANGE,
    pendingEmail: nextEmail,
    ttlMinutes: 60 * 24,
  });

  await sendEmailChangeVerificationEmail({
    to: nextEmail,
    name: user.name,
    token,
  });

  return NextResponse.json({ ok: true });
}
