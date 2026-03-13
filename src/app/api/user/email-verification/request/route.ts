import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_ACTION,
  issueAccountActionToken,
  sendEmailVerificationEmail,
} from "@/lib/account-actions";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  });

  if (!user?.email) {
    return NextResponse.json({ error: "Email unavailable." }, { status: 400 });
  }

  const token = await issueAccountActionToken({
    userId: user.id,
    action: ACCOUNT_ACTION.EMAIL_VERIFY,
    ttlMinutes: 60 * 24,
  });

  await sendEmailVerificationEmail({
    to: user.email,
    name: user.name,
    token,
  });

  return NextResponse.json({ ok: true });
}
