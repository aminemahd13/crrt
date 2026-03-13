"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

type UserRole = "admin" | "member";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    registrations: number;
  };
};

function formatDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface UsersTableClientProps {
  users: UserRow[];
  currentUserId: string | null;
}

export function UsersTableClient({ users, currentUserId }: UsersTableClientProps) {
  const [rows, setRows] = useState<UserRow[]>(users);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const adminCount = useMemo(() => rows.filter((row) => row.role === "admin").length, [rows]);

  const handleRoleChange = async (userId: string, nextRole: UserRole) => {
    setMessage(null);
    setBusyUserId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage({ ok: false, text: payload.error || "Failed to update role." });
        return;
      }

      const updatedRole = payload.user?.role as UserRole | undefined;
      if (updatedRole) {
        setRows((prev) => prev.map((row) => (row.id === userId ? { ...row, role: updatedRole } : row)));
      }
      setMessage({ ok: true, text: "User role updated." });
    } catch {
      setMessage({ ok: false, text: "Failed to update role." });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    const target = rows.find((row) => row.id === userId);
    if (!target) return;

    const confirmed = window.confirm(
      `Delete account for ${target.email || target.name || "this user"}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setMessage(null);
    setBusyUserId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage({ ok: false, text: payload.error || "Failed to delete account." });
        return;
      }

      setRows((prev) => prev.filter((row) => row.id !== userId));
      setMessage({ ok: true, text: "Account deleted." });
    } catch {
      setMessage({ ok: false, text: "Failed to delete account." });
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="space-y-3">
      {message ? (
        <div
          className={`mx-4 mt-4 rounded-lg border px-3 py-2 text-xs ${
            message.ok
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      ) : null}

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
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ghost-border)] text-sm text-ice-white">
            {rows.map((user) => {
              const isSelf = currentUserId === user.id;
              const deletingLastAdmin = user.role === "admin" && adminCount <= 1;
              const disableDelete = isSelf || deletingLastAdmin || busyUserId === user.id;
              const disableRoleChange = busyUserId === user.id;

              return (
                <tr key={user.id} className="hover:bg-[var(--ghost-white)]/80">
                  <td className="px-4 py-3">{user.name || "-"}</td>
                  <td className="px-4 py-3">{user.email || "-"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      disabled={disableRoleChange}
                      onChange={(event) => handleRoleChange(user.id, event.target.value as UserRole)}
                      className="rounded-md border border-[var(--ghost-border)] bg-midnight px-2 py-1 text-xs text-ice-white"
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">{user.emailVerified ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{user._count.registrations}</td>
                  <td className="px-4 py-3 text-steel-gray">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-steel-gray">{formatDate(user.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={disableDelete}
                      onClick={() => handleDelete(user.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-steel-gray">
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
