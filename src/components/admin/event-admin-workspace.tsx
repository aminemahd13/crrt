"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlignLeft,
  ArrowLeft,
  Calendar,
  Download,
  Eye,
  EyeOff,
  GripVertical,
  Hash,
  List,
  Plus,
  Save,
  ToggleLeft,
  Trash2,
  Type,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PublishChecklist } from "@/components/admin/publish-checklist";
import { ApplicationsPanel } from "@/components/admin/applications-panel";
import { toast } from "sonner";
import type {
  ApplicationRow,
  EventAdminTab,
  RegistrationField,
} from "@/components/admin/events-admin-types";

interface EventAdminWorkspaceProps {
  mode: "create" | "edit";
  initialData: Record<string, unknown>;
  initialRegistrationFields?: RegistrationField[];
  initialApplications?: ApplicationRow[];
  initialTab?: string | null;
}

interface EventFieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "datetime";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

const DETAIL_FIELDS: EventFieldDef[] = [
  { key: "title", label: "Title", type: "text", required: true },
  {
    key: "slug",
    label: "Slug",
    type: "text",
    required: true,
    placeholder: "auto-generated-from-title",
  },
  { key: "description", label: "Description", type: "textarea", required: true },
  { key: "content", label: "Content (Markdown)", type: "textarea" },
  {
    key: "type",
    label: "Type",
    type: "select",
    required: true,
    options: [
      { value: "training", label: "Training" },
      { value: "conference", label: "Conference" },
      { value: "competition", label: "Competition" },
      { value: "workshop", label: "Workshop" },
      { value: "hackathon", label: "Hackathon" },
    ],
  },
  { key: "startDate", label: "Start Date", type: "datetime", required: true },
  { key: "endDate", label: "End Date", type: "datetime" },
  {
    key: "location",
    label: "Location",
    type: "text",
    placeholder: "e.g. Amphi B, ENSA Agadir",
  },
  { key: "capacity", label: "Capacity", type: "number" },
  { key: "coverImage", label: "Cover Image URL", type: "text" },
  {
    key: "themePreset",
    label: "Theme Preset",
    type: "select",
    required: true,
    options: [
      { value: "default", label: "Default (Orange)" },
      { value: "ocean", label: "Ocean (Blue)" },
      { value: "forest", label: "Forest (Green)" },
      { value: "sunset", label: "Sunset (Rose)" },
      { value: "slate", label: "Slate (Neutral)" },
    ],
  },
  {
    key: "themeAccent",
    label: "Theme Accent Override",
    type: "text",
    placeholder: "Optional HEX color like #F97316",
  },
  { key: "publishStart", label: "Publish Start", type: "datetime" },
  { key: "publishEnd", label: "Publish End", type: "datetime" },
];

const REGISTRATION_FIELDS: EventFieldDef[] = [
  {
    key: "registrationMode",
    label: "Registration Mode",
    type: "select",
    required: true,
    options: [
      { value: "closed", label: "Closed" },
      { value: "internal", label: "Internal" },
      { value: "external", label: "External" },
    ],
  },
  {
    key: "registrationReviewMode",
    label: "Review Mode",
    type: "select",
    options: [
      { value: "auto", label: "Auto-approve" },
      { value: "manual", label: "Manual review" },
    ],
  },
  {
    key: "registrationLabel",
    label: "Registration Button Label",
    type: "text",
    placeholder: "Optional custom CTA label",
  },
  {
    key: "registrationUrl",
    label: "Registration URL",
    type: "text",
    placeholder: "Required for external mode",
  },
];

const FORM_FIELD_TYPE_OPTIONS = [
  { type: "text", label: "Text", icon: Type },
  { type: "textarea", label: "Long Text", icon: AlignLeft },
  { type: "number", label: "Number", icon: Hash },
  { type: "select", label: "Select", icon: List },
  { type: "checkbox", label: "Checkbox", icon: ToggleLeft },
  { type: "date", label: "Date", icon: Calendar },
];

function normalizeEventAdminTab(value: string | null | undefined, mode: "create" | "edit"): EventAdminTab {
  const fallback: EventAdminTab = "details";
  if (!value) return fallback;

  if (value === "applicants" || value === "review-queue") {
    return mode === "edit" ? "applications" : fallback;
  }

  if (value === "details" || value === "registration" || value === "form-builder" || value === "applications") {
    if (mode === "create" && value === "applications") {
      return fallback;
    }
    return value;
  }
  return fallback;
}

export function EventAdminWorkspace({
  mode,
  initialData,
  initialRegistrationFields = [],
  initialApplications = [],
  initialTab,
}: EventAdminWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<Record<string, unknown>>(initialData);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<RegistrationField[]>(initialRegistrationFields);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>(initialApplications);
  const counterRef = useRef(initialRegistrationFields.length);
  const isEditMode = mode === "edit";
  const eventId = typeof form.id === "string" ? form.id : "";
  const activeTab = normalizeEventAdminTab(searchParams.get("tab") ?? initialTab, mode);

  const update = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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

  const updateField = (
    id: string,
    key: keyof RegistrationField,
    value: string | boolean | number
  ) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const handleSave = async () => {
    setSaving(true);
    const id = typeof form.id === "string" ? form.id : "";
    const url = mode === "create" ? "/api/admin/events" : `/api/admin/events/${id}`;

    try {
      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, registrationFields: fields }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        toast.error(payload.error || "Failed to save event.");
        return;
      }

      toast.success("Event saved.");
      router.push("/admin/events");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (value: string) => {
    const nextTab = normalizeEventAdminTab(value, mode);
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "details") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const renderField = (field: EventFieldDef) => (
    <div key={field.key} className="glass-card p-5 space-y-2">
      <label className="text-xs font-medium text-steel-gray uppercase tracking-wider">
        {field.label} {field.required && <span className="text-signal-orange">*</span>}
      </label>

      {field.type === "text" && (
        <Input
          data-testid={`event-field-${field.key}`}
          type="text"
          value={typeof form[field.key] === "string" ? (form[field.key] as string) : ""}
          onChange={(e) => update(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="border-[var(--ghost-border)] bg-midnight text-ice-white placeholder:text-steel-gray"
        />
      )}

      {field.type === "textarea" && (
        <Textarea
          data-testid={`event-field-${field.key}`}
          value={typeof form[field.key] === "string" ? (form[field.key] as string) : ""}
          onChange={(e) => update(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={field.key === "content" ? 12 : 3}
          className="border-[var(--ghost-border)] bg-midnight text-ice-white placeholder:text-steel-gray resize-y font-mono"
        />
      )}

      {field.type === "select" && (
        <Select
          value={
            typeof form[field.key] === "string" && (form[field.key] as string).length > 0
              ? (form[field.key] as string)
              : undefined
          }
          onValueChange={(value) => update(field.key, value)}
        >
          <SelectTrigger
            data-testid={`event-field-${field.key}`}
            className="w-full border-[var(--ghost-border)] bg-midnight text-ice-white"
          >
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
            {field.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "number" && (
        <Input
          data-testid={`event-field-${field.key}`}
          type="number"
          value={
            typeof form[field.key] === "number"
              ? (form[field.key] as number)
              : typeof form[field.key] === "string"
                ? (form[field.key] as string)
                : ""
          }
          onChange={(e) => update(field.key, e.target.value ? parseInt(e.target.value, 10) : null)}
          className="border-[var(--ghost-border)] bg-midnight text-ice-white"
        />
      )}

      {field.type === "datetime" && (
        <Input
          data-testid={`event-field-${field.key}`}
          type="datetime-local"
          value={typeof form[field.key] === "string" ? (form[field.key] as string) : ""}
          onChange={(e) => update(field.key, e.target.value)}
          className="border-[var(--ghost-border)] bg-midnight text-ice-white"
        />
      )}
    </div>
  );

  const checklistContent = {
    title: typeof form.title === "string" ? form.title : "",
    description:
      typeof form.description === "string"
        ? form.description
        : typeof form.excerpt === "string"
          ? form.excerpt
          : "",
    slug: typeof form.slug === "string" ? form.slug : "",
    content: typeof form.content === "string" ? form.content : "",
    coverImage: typeof form.coverImage === "string" ? form.coverImage : null,
    status: form.published ? "published" : "draft",
  } as const;

  const backHref = "/admin/events";
  const published = Boolean(form.published);
  const csvHref = eventId ? `/api/admin/events/${eventId}/registrations?format=csv` : "";

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="p-2 rounded-lg hover:bg-white/5 text-steel-gray hover:text-ice-white transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-heading font-bold text-ice-white">
              {mode === "create" ? "New Event" : "Edit Event"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => update("published", !published)}
            variant="outline"
            size="sm"
            className={`${
              published
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                : "border-[var(--ghost-border)] bg-transparent text-steel-gray hover:bg-white/5 hover:text-ice-white"
            }`}
          >
            {published ? <Eye size={12} /> : <EyeOff size={12} />}
            {published ? "Published" : "Draft"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            data-testid="event-save-button"
          >
            <Save size={12} />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <PublishChecklist contentType="event" data={checklistContent} />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-[var(--ghost-white)] border border-[var(--ghost-border)]">
          <TabsTrigger
            value="details"
            className="data-[state=active]:bg-signal-orange data-[state=active]:text-white"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="registration"
            className="data-[state=active]:bg-signal-orange data-[state=active]:text-white"
          >
            Registration
          </TabsTrigger>
          <TabsTrigger
            value="form-builder"
            className="data-[state=active]:bg-signal-orange data-[state=active]:text-white"
          >
            Form Builder
          </TabsTrigger>
          {isEditMode && (
            <TabsTrigger
              value="applications"
              className="data-[state=active]:bg-signal-orange data-[state=active]:text-white"
            >
              Applications
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="mt-4 space-y-4">
          {DETAIL_FIELDS.map((field) => renderField(field))}
        </TabsContent>

        <TabsContent value="registration" className="mt-4 space-y-4">
          {REGISTRATION_FIELDS.map((field) => renderField(field))}
          {(form.registrationMode as string) !== "internal" && (
            <div className="text-xs text-steel-gray glass-card p-4">
              Form fields are only used for internal registration mode.
            </div>
          )}
        </TabsContent>

        <TabsContent value="form-builder" className="mt-4">
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-steel-gray uppercase tracking-wider">
                Registration Form Fields
              </label>
              <div className="flex items-center gap-1">
                {FORM_FIELD_TYPE_OPTIONS.map((ft) => (
                  <Button
                    key={ft.type}
                    type="button"
                    onClick={() => addField(ft.type)}
                    title={`Add ${ft.label}`}
                    size="icon-xs"
                    variant="ghost"
                    className="text-steel-gray hover:text-ice-white"
                  >
                    <ft.icon size={14} />
                  </Button>
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
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(field.id);
                        }}
                        variant="ghost"
                        size="icon-xs"
                        className="text-steel-gray/30 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>

                    {editingFieldId === field.id && (
                      <div
                        className="mt-3 pt-3 border-t border-[var(--ghost-border)] grid grid-cols-2 gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] text-steel-gray">Label</label>
                          <Input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(field.id, "label", e.target.value)}
                            className="h-8 border-[var(--ghost-border)] bg-midnight text-xs text-ice-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-steel-gray">Placeholder</label>
                          <Input
                            type="text"
                            value={field.placeholder ?? ""}
                            onChange={(e) => updateField(field.id, "placeholder", e.target.value)}
                            className="h-8 border-[var(--ghost-border)] bg-midnight text-xs text-ice-white"
                          />
                        </div>
                        {field.type === "select" && (
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-steel-gray">
                              Options (comma-separated)
                            </label>
                            <Input
                              type="text"
                              value={field.options ?? ""}
                              onChange={(e) => updateField(field.id, "options", e.target.value)}
                              className="h-8 border-[var(--ghost-border)] bg-midnight text-xs text-ice-white"
                              placeholder="Option1, Option2"
                            />
                          </div>
                        )}
                        <label className="col-span-2 flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={field.required}
                            onCheckedChange={(checked) =>
                              updateField(field.id, "required", checked === true)
                            }
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
        </TabsContent>

        {isEditMode && (
          <TabsContent value="applications" className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-steel-gray">{applications.length} applications</div>
              {csvHref && (
                <a
                  href={csvHref}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ghost-border)] px-4 py-2 text-xs text-steel-gray transition-colors hover:bg-white/5 hover:text-ice-white"
                >
                  <Download size={13} /> Export CSV
                </a>
              )}
            </div>

            <ApplicationsPanel
              initialRows={applications}
              showEventColumn={false}
              onRowsChange={setApplications}
              emptyMessage="No applications found for this event."
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
