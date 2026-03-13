import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      emailVerified: true,
      phone: true,
      bio: true,
      organization: true,
      city: true,
      image: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const allowedFields = ["name", "phone", "bio", "organization", "city"] as const;
  const data: Record<string, string> = {};

  for (const field of allowedFields) {
    if (typeof body[field] === "string") {
      data[field] = body[field].trim().slice(0, 500);
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      name: true,
      email: true,
      emailVerified: true,
      phone: true,
      bio: true,
      organization: true,
      city: true,
      image: true,
    },
  });

  return NextResponse.json(user);
}
