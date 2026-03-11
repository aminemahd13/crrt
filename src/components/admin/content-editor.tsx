"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { PublishChecklist } from "./publish-checklist";

interface ContentEditorProps {
  mode: "create" | "edit";
  contentType: "events" | "projects" | "posts";
  initialData?: Record<string, unknown>;
  fields: FieldDef[];
  extraPayload?: Record<string, unknown>;
  children?: React.ReactNode;
}

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "datetime" | "tags";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}

export function ContentEditor({ mode, contentType, initialData, fields, extraPayload, children }: ContentEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, unknown>>(initialData ?? {});
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const id = (initialData as Record<string, string>)?.id;
    const url = mode === "create"
      ? `/api/admin/${contentType}`
      : `/api/admin/${contentType}/${id}`;

    await fetch(url, {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ...extraPayload }),
    });
    setSaving(false);
    router.push(`/admin/${contentType}`);
    router.refresh();
  };

  const backHref = `/admin/${contentType}`;
  const labels: Record<string, string> = { events: "Event", projects: "Project", posts: "Post" };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={backHref} className="p-2 rounded-lg hover:bg-white/5 text-steel-gray hover:text-ice-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-heading font-bold text-ice-white">
              {mode === "create" ? `New ${labels[contentType]}` : `Edit ${labels[contentType]}`}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => update("published", !(form.published as boolean))}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-colors ${
              form.published
                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                : "border-[var(--ghost-border)] text-steel-gray hover:text-ice-white"
            }`}
          >
            {form.published ? <Eye size={12} /> : <EyeOff size={12} />}
            {form.published ? "Published" : "Draft"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-signal-orange text-white text-xs font-medium hover:bg-[var(--signal-orange-hover)] transition-colors disabled:opacity-50"
          >
            <Save size={12} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Publish Checklist */}
      <PublishChecklist
        contentType={contentType === "events" ? "event" : contentType === "projects" ? "project" : "post"}
        data={{
          title: form.title as string,
          description: (form.description ?? form.excerpt) as string,
          slug: form.slug as string,
          content: form.content as string,
          coverImage: form.coverImage as string | null,
          status: form.published ? "published" : "draft",
        }}
      />

      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="glass-card p-5 space-y-2">
            <label className="text-xs font-medium text-steel-gray uppercase tracking-wider">
              {field.label} {field.required && <span className="text-signal-orange">*</span>}
            </label>

            {field.type === "text" && (
              <input
                type="text"
                value={(form[field.key] as string) ?? ""}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white placeholder:text-steel-gray focus:border-signal-orange/30 focus:outline-none"
              />
            )}

            {field.type === "textarea" && (
              <textarea
                value={(form[field.key] as string) ?? ""}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={field.key === "content" ? 12 : 3}
                className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white placeholder:text-steel-gray focus:border-signal-orange/30 focus:outline-none resize-y font-mono"
              />
            )}

            {field.type === "select" && (
              <select
                value={(form[field.key] as string) ?? ""}
                onChange={(e) => update(field.key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}

            {field.type === "number" && (
              <input
                type="number"
                value={(form[field.key] as number) ?? ""}
                onChange={(e) => update(field.key, e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
              />
            )}

            {field.type === "datetime" && (
              <input
                type="datetime-local"
                value={(form[field.key] as string) ?? ""}
                onChange={(e) => update(field.key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
              />
            )}

            {field.type === "tags" && (
              <input
                type="text"
                value={(form[field.key] as string) ?? ""}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder="tag1, tag2, tag3"
                className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white placeholder:text-steel-gray"
              />
            )}
          </div>
        ))}
      </div>

      {children}
    </div>
  );
}
