"use client";

import Link from "next/link";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useState } from "react";

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  type?: string;
  date: string;
  editHref: string;
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
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setDeleting(id);
    await fetch(`/api/admin/${contentType}/${id}`, { method: "DELETE" });
    window.location.reload();
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

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-gray" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${title.toLowerCase()}...`}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-midnight-light border border-[var(--ghost-border)] text-sm text-ice-white placeholder:text-steel-gray focus:border-signal-orange/30 focus:outline-none transition-colors"
        />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--ghost-border)]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-steel-gray uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-steel-gray uppercase tracking-wider">Status</th>
              {items.some((i) => i.type) && (
                <th className="text-left px-4 py-3 text-xs font-semibold text-steel-gray uppercase tracking-wider">Type</th>
              )}
              <th className="text-left px-4 py-3 text-xs font-semibold text-steel-gray uppercase tracking-wider">Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-steel-gray uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[var(--ghost-border)] last:border-0 hover:bg-white/[0.02] transition-colors"
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
                {items.some((i) => i.type) && (
                  <td className="px-4 py-3">
                    <span className="text-xs text-steel-gray">{item.type ?? "—"}</span>
                  </td>
                )}
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
                      className="p-1.5 rounded-md text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </Link>
                    <Link
                      href={`/${contentType === "posts" ? "blog" : contentType}/${item.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-md text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
                      title="View"
                    >
                      <ExternalLink size={14} />
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="p-1.5 rounded-md text-steel-gray hover:text-red-400 hover:bg-red-500/5 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-steel-gray">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
