import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_ACTION, consumeAccountActionToken } from "@/lib/account-actions";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

interface VerifyPayload {
  token?: unknown;
}

function normalizeToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/auth/email-verification/verify", "POST");

  try {
    const body = (await request.json().catch(() => ({}))) as VerifyPayload;
    const token = normalizeToken(body.token);

    if (!token) {
      return NextResponse.json({ error: "Verification token is required." }, { status: 400 });
    }

    const actionToken = await consumeAccountActionToken({
      action: ACCOUNT_ACTION.EMAIL_VERIFY,
      token,
    });

    if (actionToken) {
      await prisma.user.update({
        where: { id: actionToken.userId },
        data: {
          emailVerified: new Date(),
        },
      });

      logInfo("email_verified", {
        pathname: "/api/auth/email-verification/verify",
        method: "POST",
        status: 200,
        requestId,
        details: { userId: actionToken.userId },
      });

      return NextResponse.json({ ok: true, changedEmail: false });
    }

    const emailChangeToken = await consumeAccountActionToken({
      action: ACCOUNT_ACTION.EMAIL_CHANGE,
      token,
    });

    if (!emailChangeToken || !emailChangeToken.pendingEmail) {
      return NextResponse.json({ error: "This verification link is invalid or expired." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: emailChangeToken.userId },
      data: {
        email: emailChangeToken.pendingEmail,
        emailVerified: new Date(),
      },
    });

    await prisma.accountActionToken.updateMany({
      where: {
        userId: emailChangeToken.userId,
        action: ACCOUNT_ACTION.EMAIL_CHANGE,
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });

    logInfo("email_change_verified", {
      pathname: "/api/auth/email-verification/verify",
      method: "POST",
      status: 200,
      requestId,
      details: { userId: emailChangeToken.userId },
    });

    return NextResponse.json({ ok: true, changedEmail: true });
  } catch (error) {
    recordApiError("/api/auth/email-verification/verify", "POST");
    logError("email_verification_failed", {
      pathname: "/api/auth/email-verification/verify",
      method: "POST",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to verify email." }, { status: 500 });
  }
}
