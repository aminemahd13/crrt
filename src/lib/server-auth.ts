import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }
  return user;
}

export async function requireAdminSession() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }
  if (!["admin", "editor"].includes(user.role)) {
    redirect("/admin/login");
  }
  return user;
}

export async function getDbUserFromSession() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) return null;
  return prisma.user.findUnique({
    where: { email: sessionUser.email },
  });
}
