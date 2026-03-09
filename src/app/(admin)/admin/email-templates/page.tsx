"use client";

import { useState } from "react";
import { Save, Check, Plus, Eye } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: "registration-confirm",
    name: "Registration Confirmation",
    subject: "✅ You're registered for {{eventTitle}}",
    body: `Hello {{name}},

You have been successfully registered for **{{eventTitle}}**.

📅 **Date:** {{eventDate}}
📍 **Location:** {{eventLocation}}

Please arrive 15 minutes early. Bring your laptop if required.

See you there!
— CRRT Team`,
  },
  {
    id: "submission-received",
    name: "Form Submission Received",
    subject: "📋 Your application has been received",
    body: `Hello {{name}},

Thank you for submitting the {{formTitle}} form. We have received your response and will review it shortly.

You'll hear back from us within 3–5 business days.

— CRRT Team`,
  },
  {
    id: "accepted",
    name: "Application Accepted",
    subject: "🎉 Congratulations! You've been accepted",
    body: `Hello {{name}},

Great news! Your application for {{formTitle}} has been **accepted**.

Next steps will be communicated soon.

— CRRT Team`,
  },
  {
    id: "rejected",
    name: "Application Rejected",
    subject: "Application Update",
    body: `Hello {{name}},

Thank you for your interest in {{formTitle}}. Unfortunately, we are unable to accept your application at this time.

We encourage you to apply again in the future.

— CRRT Team`,
  },
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [selectedId, setSelectedId] = useState<string>(defaultTemplates[0].id);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selected = templates.find((t) => t.id === selectedId);

  const updateTemplate = (key: keyof EmailTemplate, value: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === selectedId ? { ...t, [key]: value } : t))
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // In production, this would persist to DB
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-full">
      {/* Template list */}
      <div className="w-64 border-r border-[var(--ghost-border)] bg-midnight-light p-3 overflow-y-auto shrink-0">
        <div className="flex items-center justify-between mb-3 px-1">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-steel-gray/60">Templates</h4>
          <button className="text-signal-orange hover:text-signal-orange/80">
            <Plus size={14} />
          </button>
        </div>
        <div className="space-y-1">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                selectedId === t.id
                  ? "bg-signal-orange/10 text-signal-orange border border-signal-orange/20"
                  : "text-steel-gray hover:text-ice-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <span className="block truncate">{t.name}</span>
              <span className="block text-[10px] truncate mt-0.5 opacity-60">{t.subject}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selected ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-heading font-bold text-ice-white">{selected.name}</h1>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ghost-border)] text-xs text-steel-gray hover:text-ice-white hover:bg-white/5">
                  <Eye size={12} /> Preview
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-signal-orange text-white text-xs font-medium hover:bg-[var(--signal-orange-hover)] transition-colors disabled:opacity-50"
                >
                  {saved ? <Check size={12} /> : <Save size={12} />}
                  {saving ? "Saving..." : saved ? "Saved!" : "Save"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass-card p-5 space-y-2">
                <label className="text-xs text-steel-gray">Template Name</label>
                <input
                  type="text"
                  value={selected.name}
                  onChange={(e) => updateTemplate("name", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
                />
              </div>

              <div className="glass-card p-5 space-y-2">
                <label className="text-xs text-steel-gray">Subject Line</label>
                <input
                  type="text"
                  value={selected.subject}
                  onChange={(e) => updateTemplate("subject", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
                />
                <p className="text-[10px] text-steel-gray/60">
                  Variables: {"{{name}}"}, {"{{eventTitle}}"}, {"{{eventDate}}"}, {"{{formTitle}}"}
                </p>
              </div>

              <div className="glass-card p-5 space-y-2">
                <label className="text-xs text-steel-gray">Body (Markdown)</label>
                <textarea
                  value={selected.body}
                  onChange={(e) => updateTemplate("body", e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white font-mono resize-y"
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-steel-gray text-sm text-center py-20">Select a template to edit.</p>
        )}
      </div>
    </div>
  );
}
