"use client";

import Link from "next/link";
import { Plus, Inbox, FileText } from "lucide-react";

interface FormItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  version: number;
  submissionCount: number;
  createdAt: string;
}

export function FormListClient({ forms }: { forms: FormItem[] }) {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">Form Builder</h1>
          <p className="text-sm text-steel-gray mt-1">
            Create and manage registration forms, applications, and surveys.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/forms/templates"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--ghost-border)] text-xs text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
          >
            <FileText size={14} /> Templates
          </Link>
          <Link
            href="/admin/forms/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-signal-orange text-white text-xs font-medium hover:bg-[var(--signal-orange-hover)] transition-colors"
          >
            <Plus size={14} /> New Form
          </Link>
        </div>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={40} className="mx-auto text-steel-gray/30 mb-3" />
          <p className="text-sm text-steel-gray">No forms yet.</p>
          <p className="text-xs text-steel-gray/60 mt-1">Start from a template or create a blank form.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <Link
              key={form.id}
              href={`/admin/forms/${form.id}`}
              className="glass-card p-5 space-y-3 group block"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    form.status === "published"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : form.status === "draft"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}
                >
                  {form.status}
                </span>
                <span className="text-[10px] text-steel-gray">v{form.version}</span>
              </div>

              <h3 className="font-heading font-semibold text-ice-white group-hover:text-signal-orange transition-colors">
                {form.title}
              </h3>

              <div className="flex items-center gap-3 text-xs text-steel-gray">
                <span className="flex items-center gap-1">
                  <Inbox size={12} /> {form.submissionCount} responses
                </span>
                <span>
                  {new Date(form.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
