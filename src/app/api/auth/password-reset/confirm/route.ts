import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_ACTION, consumeAccountActionToken } from "@/lib/account-actions";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

interface ConfirmPayload {
  token?: unknown;
  password?: unknown;
}

function normalizeToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizePassword(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value;
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/auth/password-reset/confirm", "POST");

  try {
    const body = (await request.json().catch(() => ({}))) as ConfirmPayload;
    const token = normalizeToken(body.token);
    const password = normalizePassword(body.password);

    if (!token) {
      return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
    }
    if (!password || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const actionToken = await consumeAccountActionToken({
      action: ACCOUNT_ACTION.PASSWORD_RESET,
      token,
    });

    if (!actionToken) {
      return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: actionToken.userId },
      data: {
        password: passwordHash,
        mustRotatePassword: false,
      },
    });

    await prisma.session.deleteMany({ where: { userId: actionToken.userId } });

    logInfo("password_reset_confirmed", {
      pathname: "/api/auth/password-reset/confirm",
      method: "POST",
      status: 200,
      requestId,
      details: { userId: actionToken.userId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    recordApiError("/api/auth/password-reset/confirm", "POST");
    logError("password_reset_confirm_failed", {
      pathname: "/api/auth/password-reset/confirm",
      method: "POST",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
