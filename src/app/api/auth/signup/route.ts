import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

interface SignupPayload {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

function normalizeName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized.slice(0, 120) : null;
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function normalizePassword(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value;
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/auth/signup", "POST");

  try {
    let parsedBody: unknown;
    try {
      parsedBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!parsedBody || typeof parsedBody !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const body = parsedBody as SignupPayload;
    const name = normalizeName(body.name);
    const email = normalizeEmail(body.email);
    const password = normalizePassword(body.password);

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }
    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: "member",
        mustRotatePassword: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    logInfo("member_signup_created", {
      pathname: "/api/auth/signup",
      method: "POST",
      status: 201,
      requestId,
      details: { userId: user.id, email: user.email },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    recordApiError("/api/auth/signup", "POST");
    logError("member_signup_failed", {
      pathname: "/api/auth/signup",
      method: "POST",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
  }
}
