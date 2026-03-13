import { prisma } from "@/lib/prisma";

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
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

  return (
    <div className="space-y-6 px-6 py-6 md:px-8 md:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-ice-white">Users</h1>
        <p className="text-sm text-steel-gray">
          Complete list of registered accounts across member and admin roles.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--ghost-border)] bg-midnight-light">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--ghost-border)]">
            <thead className="bg-[var(--ghost-white)]">
              <tr className="text-left text-xs uppercase tracking-wider text-steel-gray">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Registrations</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ghost-border)] text-sm text-ice-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[var(--ghost-white)]/80">
                  <td className="px-4 py-3">{user.name || "-"}</td>
                  <td className="px-4 py-3">{user.email || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-signal-orange/30 bg-signal-orange/10 px-2 py-0.5 text-xs text-signal-orange">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">{user.emailVerified ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{user._count.registrations}</td>
                  <td className="px-4 py-3 text-steel-gray">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-steel-gray">{formatDate(user.updatedAt)}</td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-steel-gray">
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
