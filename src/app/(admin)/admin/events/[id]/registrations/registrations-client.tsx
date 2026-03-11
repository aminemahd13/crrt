"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Search } from "lucide-react";

type RegistrationStatus = "registered" | "waitlisted" | "approved" | "rejected" | "cancelled";

interface RegistrationItem {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

const STATUS_OPTIONS: RegistrationStatus[] = [
  "registered",
  "waitlisted",
  "approved",
  "rejected",
  "cancelled",
];

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  registered: "Registered",
  waitlisted: "Waitlisted",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function EventRegistrationsClient({
  event,
  registrations,
}: {
  event: { id: string; title: string; slug: string; capacity: number | null };
  registrations: RegistrationItem[];
}) {
  const [items, setItems] = useState(registrations);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        const haystack = `${item.user.name || ""} ${item.user.email || ""}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      }),
    [items, query, statusFilter]
  );

  const handleStatusUpdate = async (id: string, status: RegistrationStatus) => {
    setUpdatingId(id);
    const note = noteDraft[id] ?? "";
    const response = await fetch(`/api/admin/events/${event.id}/registrations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    if (response.ok) {
      const updated = await response.json();
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
    }
    setUpdatingId(null);
  };

  const csvHref = `/api/admin/events/${event.id}/registrations?format=csv`;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href={`/admin/events/${event.id}`}
            className="inline-flex items-center gap-2 text-xs text-steel-gray hover:text-ice-white mb-3"
          >
            <ArrowLeft size={14} /> Back to event editor
          </Link>
          <h1 className="text-2xl font-heading font-bold text-ice-white">{event.title} Registrations</h1>
          <p className="text-sm text-steel-gray mt-1">
            Capacity: {event.capacity ?? "Unlimited"} • {items.length} registrations
          </p>
        </div>
        <a
          href={csvHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--ghost-border)] text-xs text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
        >
          <Download size={13} /> Export CSV
        </a>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-gray" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by member name or email..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-midnight-light border border-[var(--ghost-border)] text-sm text-ice-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RegistrationStatus | "all")}
          className="px-3 py-2.5 rounded-lg bg-midnight-light border border-[var(--ghost-border)] text-xs text-ice-white"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--ghost-border)] text-left text-xs text-steel-gray uppercase tracking-wider">
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-[var(--ghost-border)] last:border-0">
                <td className="px-4 py-3">
                  <p className="text-sm text-ice-white">{item.user.name || "Unnamed Member"}</p>
                  <p className="text-xs text-steel-gray">{item.user.email || "No email"}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-ice-white">{STATUS_LABELS[item.status]}</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={noteDraft[item.id] ?? item.note ?? ""}
                    onChange={(e) => setNoteDraft((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Optional moderation note"
                    className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white"
                  />
                </td>
                <td className="px-4 py-3 text-xs text-steel-gray">
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(item.id, status)}
                        disabled={updatingId === item.id || item.status === status}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                          item.status === status
                            ? "bg-signal-orange/10 border-signal-orange/30 text-signal-orange"
                            : "border-[var(--ghost-border)] text-steel-gray hover:text-ice-white hover:bg-white/5"
                        }`}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-steel-gray">
                  No registrations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
