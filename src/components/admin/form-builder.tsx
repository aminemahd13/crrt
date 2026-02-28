"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Settings,
  Type,
  List,
  Hash,
  AlignLeft,
  ToggleLeft,
  Calendar,
  Layers,
  GitBranch
} from "lucide-react";
import Link from "next/link";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string;
  order: number;
}

interface FormBuilderProps {
  formId?: string;
  initialTitle?: string;
  initialSlug?: string;
  initialFields?: FormField[];
  initialStatus?: string;
}

const fieldTypes = [
  { type: "text", label: "Text", icon: Type },
  { type: "textarea", label: "Long Text", icon: AlignLeft },
  { type: "number", label: "Number", icon: Hash },
  { type: "select", label: "Select", icon: List },
  { type: "checkbox", label: "Checkbox", icon: ToggleLeft },
  { type: "date", label: "Date", icon: Calendar },
];

const formStatuses = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" }
];

export function FormBuilderClient({
  formId,
  initialTitle = "",
  initialSlug = "",
  initialFields = [],
  initialStatus = "draft",
}: FormBuilderProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [status, setStatus] = useState(initialStatus);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addField = (type: string) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      label: "",
      type,
      required: false,
      placeholder: "",
      options: "",
      order: fields.length,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedField(newField.id);
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedField === id) setSelectedField(null);
  };

  const updateField = (id: string, key: keyof FormField, value: string | boolean | number) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const url = formId ? `/api/admin/forms/${formId}` : "/api/admin/forms";
    const method = formId ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, fields, status: initialStatus }),
    });
    setSaving(false);
    router.push("/admin/forms");
    router.refresh();
  };

  const selected = fields.find((f) => f.id === selectedField);
  const FieldTypeIcon = selected
    ? (fieldTypes.find((ft) => ft.type === selected.type)?.icon ?? Type)
    : Type;

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ghost-border)] bg-midnight-light shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/admin/forms" className="p-1.5 rounded-md hover:bg-white/5 text-steel-gray">
            <ArrowLeft size={16} />
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Form title..."
            className="bg-transparent text-ice-white font-heading font-semibold text-lg focus:outline-none placeholder:text-steel-gray/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ghost-border)] text-xs text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors">
            <Eye size={12} /> Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-signal-orange text-white text-xs font-medium hover:bg-[var(--signal-orange-hover)] transition-colors disabled:opacity-50"
          >
            <Save size={12} /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* 3-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Field Library */}
        <div className="w-56 border-r border-[var(--ghost-border)] bg-midnight-light p-3 overflow-y-auto shrink-0">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-steel-gray/60 mb-2 px-1">
            Field Library
          </h4>
          <div className="space-y-1">
            {fieldTypes.map((ft) => (
              <button
                key={ft.type}
                onClick={() => addField(ft.type)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
              >
                <ft.icon size={14} />
                {ft.label}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--ghost-border)]">
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-steel-gray/60 mb-2 px-1">
              Form Settings
            </h4>
            <div className="px-1 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-steel-gray">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white focus:border-signal-orange/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-steel-gray">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white focus:border-signal-orange/50 transition-colors"
                >
                  {formStatuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-2 mt-2 rounded-lg bg-ghost-white border border-ghost-border space-y-2">
                 <div className="flex items-center gap-2 text-xs text-steel-gray">
                    <Layers size={12} className="text-signal-orange"/>
                    <span>Workflow Enabled</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs text-steel-gray">
                    <GitBranch size={12} className="text-signal-orange"/>
                    <span>Version <span className="text-ice-white font-mono">v1</span></span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-xl mx-auto space-y-2">
            {fields.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-[var(--ghost-border)] rounded-xl">
                <Plus size={24} className="mx-auto text-steel-gray/30 mb-2" />
                <p className="text-sm text-steel-gray">Click a field type to add it.</p>
              </div>
            ) : (
              fields.map((field) => (
                <div
                  key={field.id}
                  onClick={() => setSelectedField(field.id)}
                  className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedField === field.id
                      ? "border-signal-orange/30 bg-signal-orange/5"
                      : "border-[var(--ghost-border)] bg-midnight-light hover:border-[rgba(248,250,252,0.12)]"
                  }`}
                >
                  <GripVertical size={14} className="text-steel-gray/30 mt-3 shrink-0 cursor-grab" />
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-steel-gray">
                      {field.label || <span className="italic text-steel-gray/50">Untitled field</span>}
                      {field.required && <span className="text-signal-orange ml-1">*</span>}
                    </label>
                    {field.type === "textarea" ? (
                      <div className="w-full h-16 rounded-lg bg-midnight border border-[var(--ghost-border)]" />
                    ) : field.type === "select" ? (
                      <div className="w-full h-9 rounded-lg bg-midnight border border-[var(--ghost-border)] flex items-center px-3 text-xs text-steel-gray/40">
                        Select...
                      </div>
                    ) : field.type === "checkbox" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-[var(--ghost-border)] bg-midnight" />
                        <span className="text-xs text-steel-gray/60">{field.placeholder || "Checkbox"}</span>
                      </div>
                    ) : (
                      <div className="w-full h-9 rounded-lg bg-midnight border border-[var(--ghost-border)]" />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeField(field.id);
                    }}
                    className="p-1 text-steel-gray/30 hover:text-red-400 shrink-0 mt-2"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Inspector */}
        <div className="w-72 border-l border-[var(--ghost-border)] bg-midnight-light p-4 overflow-y-auto shrink-0">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--ghost-border)]">
                <FieldTypeIcon size={14} className="text-signal-orange" />
                <h4 className="text-xs font-semibold text-ice-white uppercase tracking-wider">
                  {fieldTypes.find((ft) => ft.type === selected.type)?.label} Field
                </h4>
              </div>

              {/* Basic Settings */}
              <div className="space-y-1">
                <label className="text-[10px] text-steel-gray font-medium uppercase tracking-wider">Label</label>
                <input
                  type="text"
                  value={selected.label}
                  onChange={(e) => updateField(selected.id, "label", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-steel-gray font-medium uppercase tracking-wider">Placeholder</label>
                <input
                  type="text"
                  value={selected.placeholder ?? ""}
                  onChange={(e) => updateField(selected.id, "placeholder", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white"
                />
              </div>

              {selected.type === "select" && (
                <div className="space-y-1">
                  <label className="text-[10px] text-steel-gray font-medium uppercase tracking-wider">Options (comma-separated)</label>
                  <input
                    type="text"
                    value={selected.options ?? ""}
                    onChange={(e) => updateField(selected.id, "options", e.target.value)}
                    className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white"
                    placeholder="Option1, Option2"
                  />
                </div>
              )}

              {/* Validation Rules */}
              <div className="pt-3 border-t border-[var(--ghost-border)] space-y-3">
                <h5 className="text-[10px] text-steel-gray font-semibold uppercase tracking-widest">Validation</h5>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.required}
                    onChange={(e) => updateField(selected.id, "required", e.target.checked)}
                    className="accent-signal-orange"
                  />
                  <span className="text-xs text-steel-gray">Required</span>
                </label>

                {(selected.type === "text" || selected.type === "textarea") && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-steel-gray">Min Length</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-steel-gray">Max Length</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="∞"
                          className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-steel-gray">Pattern (regex)</label>
                      <input
                        type="text"
                        placeholder="e.g. ^[A-Za-z]+$"
                        className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white font-mono"
                      />
                    </div>
                  </>
                )}

                {selected.type === "number" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-steel-gray">Min Value</label>
                      <input
                        type="number"
                        placeholder="—"
                        className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-steel-gray">Max Value</label>
                      <input
                        type="number"
                        placeholder="—"
                        className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Logic Hooks */}
              <div className="pt-3 border-t border-[var(--ghost-border)] space-y-2">
                <h5 className="text-[10px] text-steel-gray font-semibold uppercase tracking-widest">Logic</h5>
                <p className="text-[10px] text-steel-gray/60">
                  Conditional visibility and skip logic available per field.
                </p>
                <select className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-steel-gray">
                  <option value="">No condition</option>
                  <option value="show_if">Show if...</option>
                  <option value="hide_if">Hide if...</option>
                  <option value="require_if">Require if...</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Settings size={20} className="text-steel-gray/20 mb-2" />
              <p className="text-xs text-steel-gray/60">Select a field to inspect.</p>
              <p className="text-[10px] text-steel-gray/40 mt-1">Configure label, validation, and logic.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
