"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFiltersBar } from "@/components/admin/admin-filters-bar";
import { ConfirmActionModal } from "@/components/admin/confirm-action-modal";
import { AdminToastViewport, useAdminToast } from "@/components/admin/admin-toast";

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  type?: string;
  date: string;
  editHref: string;
  viewHref?: string;
}

interface ContentListClientProps {
  title: string;
  description: string;
  createHref: string;
  items: ContentItem[];
  contentType: string;
}

export function ContentListClient({
  title,
  description,
  createHref,
  items,
  contentType,
}: ContentListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ContentItem[]>(items);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toasts, dismissToast, pushToast } = useAdminToast();

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((item) => {
      const haystack = `${item.title} ${item.slug} ${item.type ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, search]);

  const deleteTarget = rows.find((item) => item.id === confirmDeleteId) ?? null;
  const hasTypeColumn = rows.some((item) => Boolean(item.type));

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      const response = await fetch(`/api/admin/${contentType}/${deleteTarget.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        pushToast("error", payload.error ?? "Failed to delete item.");
        return;
      }

      setRows((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setConfirmDeleteId(null);
      pushToast("success", "Item deleted.");
      router.refresh();
    } catch {
      pushToast("error", "Failed to delete item.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">{title}</h1>
          <p className="text-sm text-steel-gray mt-1">{description}</p>
        </div>
        <Link
          href={createHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-signal-orange text-white text-xs font-medium hover:bg-[var(--signal-orange-hover)] transition-colors"
        >
          <Plus size={14} /> Create New
        </Link>
      </div>

      <AdminFiltersBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${title.toLowerCase()}...`}
      />

      <AdminDataTable
        columns={[
          { key: "title", label: "Title" },
          { key: "status", label: "Status" },
          ...(hasTypeColumn ? [{ key: "type", label: "Type" }] : []),
          { key: "date", label: "Date" },
          { key: "actions", label: "Actions", className: "text-right" },
        ]}
        empty={filtered.length === 0}
        emptyMessage="No items found."
      >
        {filtered.map((item) => (
          <tr
            key={item.id}
            tabIndex={0}
            role="link"
            onClick={() => router.push(item.editHref)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              router.push(item.editHref);
            }}
            className="border-b border-[var(--ghost-border)] last:border-0 cursor-pointer transition-colors hover:bg-white/[0.02] focus-visible:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange/40"
          >
            <td className="px-4 py-3">
              <div>
                <p className="text-sm text-ice-white font-medium">{item.title}</p>
                <p className="text-xs text-steel-gray">{item.slug}</p>
              </div>
            </td>
            <td className="px-4 py-3">
              <span
                className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  item.status === "published"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {item.status}
              </span>
            </td>
            {hasTypeColumn ? (
              <td className="px-4 py-3">
                <span className="text-xs text-steel-gray">{item.type ?? "-"}</span>
              </td>
            ) : null}
            <td className="px-4 py-3">
              <span className="text-xs text-steel-gray">
                {new Date(item.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-1">
                <Link
                  href={item.editHref}
                  onClick={(event) => event.stopPropagation()}
                  className="p-1.5 rounded-md text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
                  title="Edit"
                >
                  <Pencil size={14} />
                </Link>
                <Link
                  href={item.viewHref || `/${contentType === "posts" ? "blog" : contentType}/${item.slug}`}
                  target="_blank"
                  onClick={(event) => event.stopPropagation()}
                  className="p-1.5 rounded-md text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
                  title="View"
                >
                  <ExternalLink size={14} />
                </Link>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setConfirmDeleteId(item.id);
                  }}
                  className="p-1.5 rounded-md text-steel-gray hover:text-red-400 hover:bg-red-500/5 transition-colors"
                  title="Delete"
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
        title="Delete Item"
        description="This action is permanent."
        confirmLabel="Delete"
        loading={Boolean(deleteTarget && deletingId === deleteTarget.id)}
        onConfirm={async () => {
          await handleDelete();
        }}
      />

      <AdminToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
