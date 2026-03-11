"use client";

import { useRef, useState } from "react";
import { ContentEditor } from "@/components/admin/content-editor";
import { Plus, Trash2, GripVertical, Type, AlignLeft, Hash, List, ToggleLeft, Calendar } from "lucide-react";

interface RegistrationField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string;
  order: number;
}

const eventFields = [
  { key: "title", label: "Title", type: "text" as const, required: true },
  { key: "slug", label: "Slug", type: "text" as const, required: true, placeholder: "auto-generated-from-title" },
  { key: "description", label: "Description", type: "textarea" as const, required: true },
  { key: "content", label: "Content (Markdown)", type: "textarea" as const },
  { key: "type", label: "Type", type: "select" as const, required: true, options: [
    { value: "training", label: "Training" },
    { value: "conference", label: "Conference" },
    { value: "competition", label: "Competition" },
    { value: "workshop", label: "Workshop" },
    { value: "hackathon", label: "Hackathon" },
  ]},
  { key: "startDate", label: "Start Date", type: "datetime" as const, required: true },
  { key: "endDate", label: "End Date", type: "datetime" as const },
  { key: "location", label: "Location", type: "text" as const, placeholder: "e.g. Amphi B, ENSA Agadir" },
  { key: "capacity", label: "Capacity", type: "number" as const },
  { key: "coverImage", label: "Cover Image URL", type: "text" as const },
  { key: "themePreset", label: "Theme Preset", type: "select" as const, required: true, options: [
    { value: "default", label: "Default (Orange)" },
    { value: "ocean", label: "Ocean (Blue)" },
    { value: "forest", label: "Forest (Green)" },
    { value: "sunset", label: "Sunset (Rose)" },
    { value: "slate", label: "Slate (Neutral)" },
  ]},
  { key: "themeAccent", label: "Theme Accent Override", type: "text" as const, placeholder: "Optional HEX color like #F97316" },
  { key: "registrationMode", label: "Registration Mode", type: "select" as const, required: true, options: [
    { value: "closed", label: "Closed" },
    { value: "internal", label: "Internal" },
    { value: "external", label: "External" },
  ]},
  { key: "registrationReviewMode", label: "Review Mode", type: "select" as const, options: [
    { value: "auto", label: "Auto-approve" },
    { value: "manual", label: "Manual review" },
  ]},
  { key: "registrationLabel", label: "Registration Button Label", type: "text" as const, placeholder: "Optional custom CTA label" },
  { key: "registrationUrl", label: "Registration URL", type: "text" as const, placeholder: "Required for external mode" },
  { key: "publishStart", label: "Publish Start", type: "datetime" as const },
  { key: "publishEnd", label: "Publish End", type: "datetime" as const },
];

const fieldTypeOptions = [
  { type: "text", label: "Text", icon: Type },
  { type: "textarea", label: "Long Text", icon: AlignLeft },
  { type: "number", label: "Number", icon: Hash },
  { type: "select", label: "Select", icon: List },
  { type: "checkbox", label: "Checkbox", icon: ToggleLeft },
  { type: "date", label: "Date", icon: Calendar },
];

export default function NewEventPage() {
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const counterRef = useRef(0);

  const addField = (type: string) => {
    const newField: RegistrationField = {
      id: `new-${counterRef.current}`,
      label: "",
      type,
      required: false,
      placeholder: "",
      options: "",
      order: fields.length,
    };
    counterRef.current += 1;
    setFields((prev) => [...prev, newField]);
    setEditingFieldId(newField.id);
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (editingFieldId === id) setEditingFieldId(null);
  };

  const updateField = (id: string, key: keyof RegistrationField, value: string | boolean | number) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  return (
    <ContentEditor
      mode="create"
      contentType="events"
      initialData={{ published: false, type: "training", themePreset: "default", registrationMode: "internal", registrationReviewMode: "auto" }}
      fields={eventFields}
      extraPayload={{ registrationFields: fields }}
    >
      {/* Inline Registration Form Builder */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-steel-gray uppercase tracking-wider">
            Registration Form Fields
          </label>
          <div className="flex items-center gap-1">
            {fieldTypeOptions.map((ft) => (
              <button
                key={ft.type}
                type="button"
                onClick={() => addField(ft.type)}
                title={`Add ${ft.label}`}
                className="p-1.5 rounded-md text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
              >
                <ft.icon size={14} />
              </button>
            ))}
          </div>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-[var(--ghost-border)] rounded-xl">
            <Plus size={20} className="mx-auto text-steel-gray/30 mb-1" />
            <p className="text-xs text-steel-gray">Add fields for the registration form.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field) => (
              <div
                key={field.id}
                onClick={() => setEditingFieldId(field.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  editingFieldId === field.id
                    ? "border-signal-orange/30 bg-signal-orange/5"
                    : "border-[var(--ghost-border)] bg-midnight hover:border-[rgba(248,250,252,0.12)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <GripVertical size={12} className="text-steel-gray/30 shrink-0 cursor-grab" />
                  <span className="text-xs text-ice-white flex-1">
                    {field.label || <span className="italic text-steel-gray/50">Untitled</span>}
                    {field.required && <span className="text-signal-orange ml-1">*</span>}
                  </span>
                  <span className="text-[10px] text-steel-gray/50 uppercase">{field.type}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                    className="p-1 text-steel-gray/30 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {editingFieldId === field.id && (
                  <div className="mt-3 pt-3 border-t border-[var(--ghost-border)] grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1">
                      <label className="text-[10px] text-steel-gray">Label</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(field.id, "label", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-steel-gray">Placeholder</label>
                      <input
                        type="text"
                        value={field.placeholder ?? ""}
                        onChange={(e) => updateField(field.id, "placeholder", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white"
                      />
                    </div>
                    {field.type === "select" && (
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] text-steel-gray">Options (comma-separated)</label>
                        <input
                          type="text"
                          value={field.options ?? ""}
                          onChange={(e) => updateField(field.id, "options", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white"
                          placeholder="Option1, Option2"
                        />
                      </div>
                    )}
                    <label className="col-span-2 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, "required", e.target.checked)}
                        className="accent-signal-orange"
                      />
                      <span className="text-xs text-steel-gray">Required</span>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ContentEditor>
  );
}
