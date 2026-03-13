"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Check, Plus, Eye, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface EmailTemplate {
  id?: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  enabled: boolean;
}

interface TemplateVariable {
  key: string;
  description: string;
  sample: string;
  templates: readonly string[];
}

const EMPTY_TEMPLATE: EmailTemplate = {
  key: "",
  name: "New Template",
  subject: "",
  body: "",
  enabled: true,
};

const AVAILABLE_TEMPLATE_VARIABLES: ReadonlyArray<TemplateVariable> = [
  {
    key: "name",
    description: "Recipient name (falls back to email when name is unavailable).",
    sample: "Alex Doe",
    templates: [
      "registration-confirmed",
      "registration-waitlisted",
      "registration-status-update",
      "form-submission-received",
    ],
  },
  {
    key: "eventTitle",
    description: "Event title shown in registration-related emails.",
    sample: "Community Workshop",
    templates: [
      "registration-confirmed",
      "registration-waitlisted",
      "registration-status-update",
    ],
  },
  {
    key: "status",
    description: "Registration status label (for example: confirmed, waitlisted, approved).",
    sample: "confirmed",
    templates: [
      "registration-confirmed",
      "registration-waitlisted",
      "registration-status-update",
    ],
  },
  {
    key: "note",
    description: "Optional admin note for status update emails.",
    sample: "Bring a photo ID at check-in.",
    templates: ["registration-status-update"],
  },
  {
    key: "formTitle",
    description: "Form name/title used by form submission notifications.",
    sample: "General Inquiry",
    templates: ["form-submission-received"],
  },
];

const PREVIEW_DEFAULT_VALUES: Record<string, string> = Object.fromEntries(
  AVAILABLE_TEMPLATE_VARIABLES.map((variable) => [variable.key, variable.sample])
);

function extractTemplateVariables(input: string): string[] {
  const seen = new Set<string>();
  const matches = input.matchAll(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g);
  for (const match of matches) {
    if (!match[1]) continue;
    seen.add(match[1]);
  }
  return Array.from(seen);
}

function renderTemplatePreview(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, variable: string) => {
    return values[variable] ?? `example_${variable}`;
  });
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/email-templates");
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Failed to load templates");
        const items = payload.templates as EmailTemplate[];
        setTemplates(items);
        setSelectedKey(items[0]?.key || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load templates");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const selected = useMemo(
    () => templates.find((template) => template.key === selectedKey),
    [templates, selectedKey]
  );

  const selectedTemplateVariables = useMemo(() => {
    if (!selected) return AVAILABLE_TEMPLATE_VARIABLES;
    const variables = AVAILABLE_TEMPLATE_VARIABLES.filter((variable) =>
      variable.templates.some((templateKey) => templateKey === selected.key)
    );
    return variables.length > 0 ? variables : AVAILABLE_TEMPLATE_VARIABLES;
  }, [selected]);

  const previewVariables = useMemo(() => {
    if (!selected) return [];
    return extractTemplateVariables(`${selected.subject}\n${selected.body}`);
  }, [selected]);

  const unknownPreviewVariables = useMemo(() => {
    const known = new Set(AVAILABLE_TEMPLATE_VARIABLES.map((variable) => variable.key));
    return previewVariables.filter((variable) => !known.has(variable));
  }, [previewVariables]);

  const previewValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const variable of previewVariables) {
      values[variable] = PREVIEW_DEFAULT_VALUES[variable] ?? `example_${variable}`;
    }
    return values;
  }, [previewVariables]);

  const previewSubject = useMemo(() => {
    if (!selected) return "";
    return renderTemplatePreview(selected.subject, previewValues);
  }, [previewValues, selected]);

  const previewBody = useMemo(() => {
    if (!selected) return "";
    return renderTemplatePreview(selected.body, previewValues);
  }, [previewValues, selected]);

  const previewBodyLooksHtml = /<[a-z][\s\S]*>/i.test(previewBody);

  const updateTemplate = (key: keyof EmailTemplate, value: string | boolean) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.key === selectedKey ? { ...template, [key]: value } : template
      )
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const response = await fetch("/api/admin/email-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templates }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(payload.error || "Failed to save templates");
      return;
    }
    setTemplates(payload.templates as EmailTemplate[]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addTemplate = () => {
    const key = `custom-${Date.now()}`;
    const next = {
      ...EMPTY_TEMPLATE,
      key,
      name: `Custom Template ${templates.length + 1}`,
    };
    setTemplates((prev) => [...prev, next]);
    setSelectedKey(key);
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-steel-gray">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-72 border-r border-[var(--ghost-border)] bg-midnight-light p-3 overflow-y-auto shrink-0">
        <div className="flex items-center justify-between mb-3 px-1">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-steel-gray/60">Templates</h4>
          <button onClick={addTemplate} className="text-signal-orange hover:text-signal-orange/80">
            <Plus size={14} />
          </button>
        </div>
        <div className="space-y-1">
          {templates.map((template) => (
            <button
              key={template.key}
              onClick={() => setSelectedKey(template.key)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                selectedKey === template.key
                  ? "bg-signal-orange/10 text-signal-orange border border-signal-orange/20"
                  : "text-steel-gray hover:text-ice-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <span className="block truncate">{template.name}</span>
              <span className="block text-[10px] truncate mt-0.5 opacity-60">{template.subject}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {selected ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-xl font-heading font-bold text-ice-white">{selected.name}</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ghost-border)] text-xs text-steel-gray hover:text-ice-white hover:bg-white/5"
                >
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

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                <AlertCircle size={12} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="glass-card p-5 space-y-2">
                <label className="text-xs text-steel-gray">Template Key</label>
                <input
                  type="text"
                  value={selected.key}
                  onChange={(e) => updateTemplate("key", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
                />
              </div>

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
              </div>

              <div className="glass-card p-5 space-y-3">
                <label className="text-xs text-steel-gray">Available Variables</label>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplateVariables.map((variable) => (
                    <span
                      key={variable.key}
                      className="rounded-full border border-[var(--ghost-border)] bg-midnight px-2 py-1 text-[11px] text-ice-white"
                    >
                      {`{{${variable.key}}}`}
                    </span>
                  ))}
                </div>
                <div className="space-y-1">
                  {selectedTemplateVariables.map((variable) => (
                    <p key={variable.key} className="text-[11px] text-steel-gray">
                      <span className="text-ice-white">{`{{${variable.key}}}`}</span> {variable.description}
                    </p>
                  ))}
                </div>
                {unknownPreviewVariables.length > 0 ? (
                  <p className="text-[11px] text-amber-300">
                    Unknown placeholders in this template:{" "}
                    {unknownPreviewVariables.map((variable) => `{{${variable}}}`).join(", ")}.
                    Add backend variables before using them in production emails.
                  </p>
                ) : null}
              </div>

              <div className="glass-card p-5 space-y-2">
                <label className="text-xs text-steel-gray">Body (HTML with {"{{variables}}"})</label>
                <textarea
                  value={selected.body}
                  onChange={(e) => updateTemplate("body", e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white font-mono resize-y"
                />
              </div>

              <div className="glass-card p-5">
                <label className="inline-flex items-center gap-2 text-xs text-steel-gray">
                  <input
                    type="checkbox"
                    checked={selected.enabled}
                    onChange={(e) => updateTemplate("enabled", e.target.checked)}
                    className="accent-signal-orange"
                  />
                  Enabled
                </label>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-steel-gray text-sm text-center py-20">Select a template to edit.</p>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-[var(--ghost-border)] bg-midnight-light text-ice-white sm:max-w-3xl">
          <div className="space-y-4">
            <div className="space-y-1">
              <DialogTitle className="text-base font-semibold text-ice-white">
                Template Preview{selected?.name ? `: ${selected.name}` : ""}
              </DialogTitle>
              <DialogDescription className="text-xs text-steel-gray">
                Uses sample values for template variables.
              </DialogDescription>
            </div>

            <div className="space-y-2 rounded-lg border border-[var(--ghost-border)] bg-midnight p-3">
              <p className="text-xs text-steel-gray">
                <span className="text-ice-white">Subject:</span> {previewSubject || "(No subject)"}
              </p>
              {previewVariables.length > 0 ? (
                <p className="text-[11px] text-steel-gray">
                  Variables: {previewVariables.map((variable) => `{{${variable}}}`).join(", ")}
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border border-[var(--ghost-border)] bg-midnight p-4 text-sm text-ice-white">
              {previewBodyLooksHtml ? (
                <div
                  className="prose prose-sm max-w-none prose-a:text-signal-orange prose-strong:text-ice-white"
                  dangerouslySetInnerHTML={{ __html: previewBody || "<p>(No body)</p>" }}
                />
              ) : (
                <pre className="whitespace-pre-wrap break-words font-sans text-sm">
                  {previewBody || "(No body)"}
                </pre>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
