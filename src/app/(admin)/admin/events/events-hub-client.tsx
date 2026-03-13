"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFiltersBar } from "@/components/admin/admin-filters-bar";
import { ConfirmActionModal } from "@/components/admin/confirm-action-modal";
import { AdminToastViewport, useAdminToast } from "@/components/admin/admin-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/ui/page-header";
import type { EventListRow } from "@/components/admin/events-admin-types";
import { appCopy } from "@/lib/copy";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EventsHubClient({ events }: { events: EventListRow[] }) {
  const router = useRouter();
  const messages = appCopy;
  const [query, setQuery] = useState("");
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { pushToast } = useAdminToast();

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
      <PageHeader
        title={messages.nav.events}
        description="Manage event content and jump directly to event-scoped applications."
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="border-[var(--ghost-border)] bg-transparent text-steel-gray hover:bg-white/5 hover:text-ice-white">
              <Link href="/admin/applications">
                <Users size={14} /> Applications Center
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/events/new">
                <Plus size={14} /> Create New
              </Link>
            </Button>
          </>
        }
      />

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
          { key: "applications", label: "Registrations" },
          { key: "date", label: "Date" },
          { key: "actions", label: "", className: "w-10" },
        ]}
        empty={filteredEvents.length === 0}
        emptyMessage="No events found."
      >
        {filteredEvents.map((item) => {
          const fillPercent = item.capacity ? Math.round((item.registrationsCount / item.capacity) * 100) : null;

          return (
            <tr
              key={item.id}
              tabIndex={0}
              role="link"
              onClick={() => router.push(`/admin/events/${item.id}`)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                router.push(`/admin/events/${item.id}`);
              }}
              className="border-b border-[var(--ghost-border)] last:border-0 cursor-pointer transition-colors hover:bg-white/[0.02] focus-visible:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange/40"
            >
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-ice-white">{item.title}</p>
                <p className="text-xs text-steel-gray">{item.slug}</p>
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant="outline"
                  className={
                    item.status === "published"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }
                >
                  {item.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant="secondary" className="bg-[var(--ghost-white)] border-[var(--ghost-border)] text-steel-gray capitalize">
                  {item.type}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="space-y-1 min-w-[100px]">
                  <span className="text-xs text-steel-gray">
                    {item.registrationsCount}{item.capacity ? ` / ${item.capacity}` : ""}
                  </span>
                  {fillPercent !== null && (
                    <Progress value={fillPercent} className="h-1" />
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-steel-gray">{formatDate(item.date)}</td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-steel-gray hover:text-ice-white"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-[var(--ghost-border)] bg-midnight text-ice-white">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/events/${item.id}`} className="cursor-pointer">
                        <Pencil size={14} /> Edit Event
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/applications?eventId=${item.id}`} className="cursor-pointer">
                        <Users size={14} /> View Applications
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/events/${item.slug}`} target="_blank" className="cursor-pointer">
                        <ExternalLink size={14} /> View Public Page
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[var(--ghost-border)]" />
                    <DropdownMenuItem
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="text-red-400 focus:text-red-400 cursor-pointer"
                    >
                      <Trash2 size={14} /> Delete Event
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          );
        })}
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

      <AdminToastViewport />
    </div>
  );
}
