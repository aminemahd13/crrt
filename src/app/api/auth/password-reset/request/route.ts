import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_ACTION,
  issueAccountActionToken,
  sendPasswordResetEmail,
} from "@/lib/account-actions";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

interface RequestPayload {
  email?: unknown;
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/auth/password-reset/request", "POST");

  try {
    const body = (await request.json().catch(() => ({}))) as RequestPayload;
    const email = normalizeEmail(body.email);

    if (!email) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (user?.email) {
      const token = await issueAccountActionToken({
        userId: user.id,
        action: ACCOUNT_ACTION.PASSWORD_RESET,
        ttlMinutes: 60,
      });

      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token,
      });
    }

    logInfo("password_reset_request_received", {
      pathname: "/api/auth/password-reset/request",
      method: "POST",
      status: 200,
      requestId,
      details: { email },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    recordApiError("/api/auth/password-reset/request", "POST");
    logError("password_reset_request_failed", {
      pathname: "/api/auth/password-reset/request",
      method: "POST",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to process password reset request." }, { status: 500 });
  }
}
