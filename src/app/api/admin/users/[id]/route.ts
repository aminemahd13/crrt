import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

async function adminCount(): Promise<number> {
  return prisma.user.count({ where: { role: "admin" } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/users/[id]", "PATCH");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { role?: unknown };
    const nextRole = typeof body.role === "string" ? body.role : null;

    if (!isUserRole(nextRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        email: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existing.id === session.user.id && nextRole !== "admin") {
      return NextResponse.json({ error: "You cannot remove your own admin role" }, { status: 400 });
    }

    if (existing.role === "admin" && nextRole === "member") {
      const count = await adminCount();
      if (count <= 1) {
        return NextResponse.json({ error: "At least one admin account must remain" }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { role: nextRole },
      select: {
        id: true,
        role: true,
        email: true,
      },
    });

    logInfo("admin_user_role_updated", {
      pathname: "/api/admin/users/[id]",
      method: "PATCH",
      status: 200,
      requestId,
      details: {
        targetUserId: updated.id,
        targetEmail: updated.email,
        previousRole: existing.role,
        nextRole: updated.role,
        actorId: session.user.id,
        actorEmail: session.user.email ?? null,
      },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (error) {
    recordApiError("/api/admin/users/[id]", "PATCH");
    logError("admin_user_role_update_failed", {
      pathname: "/api/admin/users/[id]",
      method: "PATCH",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/users/[id]", "DELETE");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        email: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ ok: true, deletedUserId: null });
    }

    if (existing.id === session.user.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    if (existing.role === "admin") {
      const count = await adminCount();
      if (count <= 1) {
        return NextResponse.json({ error: "At least one admin account must remain" }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id: existing.id } });

    logInfo("admin_user_deleted", {
      pathname: "/api/admin/users/[id]",
      method: "DELETE",
      status: 200,
      requestId,
      details: {
        targetUserId: existing.id,
        targetEmail: existing.email,
        actorId: session.user.id,
        actorEmail: session.user.email ?? null,
      },
    });

    return NextResponse.json({ ok: true, deletedUserId: existing.id });
  } catch (error) {
    recordApiError("/api/admin/users/[id]", "DELETE");
    logError("admin_user_delete_failed", {
      pathname: "/api/admin/users/[id]",
      method: "DELETE",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to delete user account" }, { status: 500 });
  }
}
