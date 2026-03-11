"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFiltersBar } from "@/components/admin/admin-filters-bar";
import { ConfirmActionModal } from "@/components/admin/confirm-action-modal";
import { AdminToastViewport, useAdminToast } from "@/components/admin/admin-toast";
import type { EventListRow } from "@/components/admin/events-admin-types";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EventsHubClient({ events }: { events: EventListRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toasts, dismissToast, pushToast } = useAdminToast();

  const filteredEvents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return events;
    return events.filter((item) => {
      const haystack = `${item.title} ${item.slug} ${item.type}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [events, query]);

  const deleteTarget = filteredEvents.find((item) => item.id === confirmDeleteId)
    ?? events.find((item) => item.id === confirmDeleteId)
    ?? null;

  const handleDeleteEvent = async () => {
    if (!deleteTarget) return;

    setDeletingEventId(deleteTarget.id);
    try {
      const response = await fetch(`/api/admin/events/${deleteTarget.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        pushToast("error", payload.error ?? "Failed to delete event.");
        return;
      }
      pushToast("success", "Event deleted.");
      router.refresh();
      setConfirmDeleteId(null);
    } catch {
      pushToast("error", "Failed to delete event.");
    } finally {
      setDeletingEventId(null);
    }
  };

  return (
    <div className="p-8 mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">Events</h1>
          <p className="mt-1 text-sm text-steel-gray">
            Manage event content and jump directly to event-scoped applications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ghost-border)] px-4 py-2 text-xs text-steel-gray transition-colors hover:bg-white/5 hover:text-ice-white"
          >
            <Users size={14} /> Applications Center
          </Link>
          <Link
            href="/admin/events/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-signal-orange px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--signal-orange-hover)]"
          >
            <Plus size={14} /> Create New
          </Link>
        </div>
      </div>

      <AdminFiltersBar
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search events..."
      />

      <AdminDataTable
        columns={[
          { key: "title", label: "Title" },
          { key: "status", label: "Status" },
          { key: "type", label: "Type" },
          { key: "applications", label: "Applications" },
          { key: "date", label: "Date" },
          { key: "actions", label: "Actions", className: "text-right" },
        ]}
        empty={filteredEvents.length === 0}
        emptyMessage="No events found."
      >
        {filteredEvents.map((item) => (
          <tr
            key={item.id}
            className="border-b border-[var(--ghost-border)] last:border-0 hover:bg-white/[0.02] transition-colors"
          >
            <td className="px-4 py-3">
              <p className="text-sm font-medium text-ice-white">{item.title}</p>
              <p className="text-xs text-steel-gray">{item.slug}</p>
            </td>
            <td className="px-4 py-3">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  item.status === "published"
                    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                }`}
              >
                {item.status}
              </span>
            </td>
            <td className="px-4 py-3 text-xs text-steel-gray">{item.type}</td>
            <td className="px-4 py-3 text-xs text-steel-gray">{item.registrationsCount}</td>
            <td className="px-4 py-3 text-xs text-steel-gray">{formatDate(item.date)}</td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-1">
                <Link
                  href={`/admin/events/${item.id}`}
                  className="rounded-md p-1.5 text-steel-gray transition-colors hover:bg-white/5 hover:text-ice-white"
                  title="Edit event"
                >
                  <Pencil size={14} />
                </Link>
                <Link
                  href={`/admin/applications?eventId=${item.id}`}
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--ghost-border)] px-2 py-1 text-[10px] text-steel-gray transition-colors hover:bg-white/5 hover:text-ice-white"
                >
                  <Users size={12} /> Applications
                </Link>
                <Link
                  href={`/events/${item.slug}`}
                  target="_blank"
                  className="rounded-md p-1.5 text-steel-gray transition-colors hover:bg-white/5 hover:text-ice-white"
                  title="View public page"
                >
                  <ExternalLink size={14} />
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(item.id)}
                  className="rounded-md p-1.5 text-steel-gray transition-colors hover:bg-red-500/5 hover:text-red-400"
                  title="Delete event"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminDataTable>

      <ConfirmActionModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
        title="Delete Event"
        description="This permanently removes the event and related records."
        confirmLabel="Delete Event"
        loading={Boolean(deleteTarget && deletingEventId === deleteTarget.id)}
        onConfirm={async () => {
          await handleDeleteEvent();
        }}
      />

      <AdminToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
