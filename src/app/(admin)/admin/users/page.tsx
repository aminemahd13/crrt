import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UsersTableClient } from "../../../../components/admin/users-table-client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  });

  const serializedUsers = users.map((user) => ({
    ...user,
    role: user.role as "admin" | "member",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
  }));

  return (
    <div className="space-y-6 px-6 py-6 md:px-8 md:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-ice-white">Users</h1>
        <p className="text-sm text-steel-gray">
          Complete list of registered accounts across member and admin roles.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--ghost-border)] bg-midnight-light">
        <UsersTableClient users={serializedUsers} currentUserId={session?.user?.id ?? null} />
      </div>
    </div>
  );
}
