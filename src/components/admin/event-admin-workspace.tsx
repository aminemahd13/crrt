"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlignLeft,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileUp,
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
import { isVisibilityRuleSatisfied } from "@/lib/form-visibility";
import { APPLICATION_MAX_UPLOAD_BYTES } from "@/lib/file-upload-policy";
import { toast } from "sonner";
import type {
  ApplicationRow,
  EventAdminTab,
  RegistrationField,
  RegistrationSection,
  VisibilityOperator,
  VisibilityRule,
} from "@/components/admin/events-admin-types";

interface EventAdminWorkspaceProps {
  mode: "create" | "edit";
  initialData: Record<string, unknown>;
  initialRegistrationSections?: RegistrationSection[];
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
  { type: "file", label: "File", icon: FileUp },
];

const FILE_ACCEPT_DEFAULT = "image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/zip";

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

function emptyVisibilityRule(): VisibilityRule {
  return {
    sourceFieldId: "",
    operator: "equals",
    value: "",
  };
}

function cleanVisibilityRule(
  value: VisibilityRule | Record<string, unknown> | null | undefined
): VisibilityRule | null {
  if (!value || typeof value !== "object") return null;
  const sourceFieldId = typeof value.sourceFieldId === "string" ? value.sourceFieldId : "";
  const operator = typeof value.operator === "string" ? value.operator : "equals";
  const rule: VisibilityRule = {
    sourceFieldId,
    operator: ["equals", "contains", "is_checked"].includes(operator)
      ? (operator as VisibilityOperator)
      : "equals",
    value: typeof value.value === "string" ? value.value : "",
  };
  return rule.sourceFieldId ? rule : null;
}

function normalizeSections(initial: RegistrationSection[]): RegistrationSection[] {
  if (initial.length === 0) {
    return [
      {
        id: "new-section-0",
        title: "Application",
        description: "",
        order: 0,
        visibility: null,
      },
    ];
  }

  return [...initial]
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({
      ...section,
      order: index,
      visibility: cleanVisibilityRule(section.visibility),
    }));
}

export function EventAdminWorkspace({
  mode,
  initialData,
  initialRegistrationSections = [],
  initialRegistrationFields = [],
  initialApplications = [],
  initialTab,
}: EventAdminWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<Record<string, unknown>>(initialData);
  const [saving, setSaving] = useState(false);
  const normalizedInitialSections = normalizeSections(initialRegistrationSections);
  const [sections, setSections] = useState<RegistrationSection[]>(normalizedInitialSections);
  const [fields, setFields] = useState<RegistrationField[]>(() =>
    [...initialRegistrationFields]
      .sort((a, b) => a.order - b.order)
      .map((field, index) => ({
        ...field,
        sectionId: field.sectionId ?? normalizedInitialSections[0].id,
        order: index,
        visibility: cleanVisibilityRule(field.visibility),
        config: {
          helperText:
            typeof field.config?.helperText === "string" ? field.config.helperText : "",
          file:
            field.type === "file"
              ? {
                  accept:
                    field.config?.file?.accept && Array.isArray(field.config.file.accept)
                      ? field.config.file.accept
                      : FILE_ACCEPT_DEFAULT.split(","),
                  maxSizeBytes:
                    typeof field.config?.file?.maxSizeBytes === "number"
                      ? field.config.file.maxSizeBytes
                      : APPLICATION_MAX_UPLOAD_BYTES,
                }
              : undefined,
        },
      }))
  );
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const applications = initialApplications;
  const counterRef = useRef(initialRegistrationFields.length);
  const sectionCounterRef = useRef(initialRegistrationSections.length);
  const isEditMode = mode === "edit";
  const eventId = typeof form.id === "string" ? form.id : "";
  const activeTab = normalizeEventAdminTab(searchParams.get("tab") ?? initialTab, mode);

  const update = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.order - b.order),
    [sections]
  );
  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.order - b.order),
    [fields]
  );

  const normalizeFieldOrders = (nextFields: RegistrationField[]) => {
    const bySection = new Map<string, number>();
    return nextFields.map((field) => {
      const sectionId = field.sectionId ?? sortedSections[0]?.id ?? "section-0";
      const order = bySection.get(sectionId) ?? 0;
      bySection.set(sectionId, order + 1);
      return { ...field, sectionId, order };
    });
  };

  const sectionFieldMap = useMemo(() => {
    const map = new Map<string, RegistrationField[]>();
    for (const section of sortedSections) {
      map.set(section.id, []);
    }
    for (const field of sortedFields) {
      const sectionId = field.sectionId ?? sortedSections[0]?.id;
      if (!sectionId) continue;
      const list = map.get(sectionId) ?? [];
      list.push(field);
      map.set(sectionId, list);
    }
    return map;
  }, [sortedSections, sortedFields]);

  const addSection = () => {
    const nextId = `new-section-${sectionCounterRef.current}`;
    sectionCounterRef.current += 1;
    setSections((prev) => [
      ...prev,
      {
        id: nextId,
        title: "New Section",
        description: "",
        order: prev.length,
        visibility: null,
      },
    ]);
  };

  const updateSection = (
    id: string,
    key: keyof RegistrationSection,
    value: string | number | VisibilityRule | null
  ) => {
    setSections((prev) =>
      prev.map((section) => (section.id === id ? { ...section, [key]: value } : section))
    );
  };

  const removeSection = (id: string) => {
    if (sections.length <= 1) return;
    const remaining = sortedSections.filter((section) => section.id !== id);
    const fallbackSectionId = remaining[0].id;
    setSections(
      remaining.map((section, index) => ({
        ...section,
        order: index,
      }))
    );
    setFields((prev) =>
      normalizeFieldOrders(
        prev.map((field) =>
          field.sectionId === id ? { ...field, sectionId: fallbackSectionId } : field
        )
      )
    );
  };

  const moveSection = (id: string, direction: "up" | "down") => {
    const items = [...sortedSections];
    const index = items.findIndex((section) => section.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const [current] = items.splice(index, 1);
    items.splice(targetIndex, 0, current);
    setSections(items.map((section, idx) => ({ ...section, order: idx })));
  };

  const addField = (type: string, sectionId?: string) => {
    const targetSectionId = sectionId ?? sortedSections[0]?.id ?? "section-0";
    const newField: RegistrationField = {
      id: `new-${counterRef.current}`,
      sectionId: targetSectionId,
      label: "",
      type,
      required: false,
      placeholder: "",
      options: "",
      order: 0,
      visibility: null,
      config:
        type === "file"
          ? {
              helperText: "",
              file: {
                accept: FILE_ACCEPT_DEFAULT.split(","),
                maxSizeBytes: APPLICATION_MAX_UPLOAD_BYTES,
              },
            }
          : {
              helperText: "",
            },
    };
    counterRef.current += 1;
    setFields((prev) => normalizeFieldOrders([...prev, newField]));
    setEditingFieldId(newField.id);
  };

  const duplicateField = (field: RegistrationField) => {
    const clone: RegistrationField = {
      ...field,
      id: `new-${counterRef.current}`,
      label: field.label ? `${field.label} (Copy)` : "",
    };
    counterRef.current += 1;
    setFields((prev) => normalizeFieldOrders([...prev, clone]));
    setEditingFieldId(clone.id);
  };

  const removeField = (id: string) => {
    setFields((prev) => normalizeFieldOrders(prev.filter((f) => f.id !== id)));
    if (editingFieldId === id) setEditingFieldId(null);
  };

  const moveField = (id: string, direction: "up" | "down") => {
    const items = [...sortedFields];
    const index = items.findIndex((field) => field.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const [current] = items.splice(index, 1);
    items.splice(targetIndex, 0, current);
    setFields(normalizeFieldOrders(items));
  };

  const updateField = (
    id: string,
    key: keyof RegistrationField,
    value: string | boolean | number | VisibilityRule | null | Record<string, unknown>
  ) => {
    setFields((prev) =>
      normalizeFieldOrders(
        prev.map((field) => (field.id === id ? { ...field, [key]: value } : field))
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const id = typeof form.id === "string" ? form.id : "";
    const url = mode === "create" ? "/api/admin/events" : `/api/admin/events/${id}`;

    const payloadSections = sortedSections.map((section, index) => ({
      id: section.id.startsWith("new-section-") ? undefined : section.id,
      title: section.title.trim() || `Section ${index + 1}`,
      description: section.description?.trim() || null,
      order: index,
      visibility: cleanVisibilityRule(section.visibility),
    }));

    const payloadFields = normalizeFieldOrders(sortedFields).map((field, index) => ({
      id: field.id.startsWith("new-") ? undefined : field.id,
      sectionId: field.sectionId,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder?.trim() || "",
      options: field.options?.trim() || "",
      order: index,
      visibility: cleanVisibilityRule(field.visibility),
      config: {
        helperText: field.config?.helperText ?? "",
        file:
          field.type === "file"
            ? {
                accept:
                  field.config?.file?.accept && Array.isArray(field.config.file.accept)
                    ? field.config.file.accept
                    : FILE_ACCEPT_DEFAULT.split(","),
                maxSizeBytes:
                  field.config?.file?.maxSizeBytes ?? APPLICATION_MAX_UPLOAD_BYTES,
              }
            : undefined,
      },
    }));

    try {
      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          registrationSections: payloadSections,
          registrationFields: payloadFields,
        }),
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
          <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-steel-gray uppercase tracking-wider">
                  Sectioned Registration Form
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addSection}>
                  <Plus size={12} /> Add Section
                </Button>
              </div>

              {sortedSections.map((section, sectionIndex) => {
                const sectionFields = sectionFieldMap.get(section.id) ?? [];
                return (
                  <div
                    key={section.id}
                    className="rounded-xl border border-[var(--ghost-border)] bg-midnight-light p-4 space-y-3"
                  >
                    <div className="grid gap-3 md:grid-cols-[1fr,auto]">
                      <div className="space-y-2">
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(section.id, "title", e.target.value)}
                          placeholder="Section title"
                          className="border-[var(--ghost-border)] bg-midnight text-ice-white"
                        />
                        <Textarea
                          rows={2}
                          value={section.description ?? ""}
                          onChange={(e) => updateSection(section.id, "description", e.target.value)}
                          placeholder="Optional section description"
                          className="border-[var(--ghost-border)] bg-midnight text-ice-white"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={sectionIndex === 0}
                          onClick={() => moveSection(section.id, "up")}
                        >
                          <ChevronUp size={12} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={sectionIndex === sortedSections.length - 1}
                          onClick={() => moveSection(section.id, "down")}
                        >
                          <ChevronDown size={12} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={sortedSections.length <= 1}
                          className="text-red-300 hover:text-red-200"
                          onClick={() => removeSection(section.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-[1fr,140px,1fr]">
                      <Select
                        value={(section.visibility?.sourceFieldId as string) || "none"}
                        onValueChange={(value) => {
                          if (value === "none") {
                            updateSection(section.id, "visibility", null);
                            return;
                          }
                          const current = section.visibility ?? emptyVisibilityRule();
                          updateSection(section.id, "visibility", {
                            ...current,
                            sourceFieldId: value,
                          });
                        }}
                      >
                        <SelectTrigger className="border-[var(--ghost-border)] bg-midnight text-ice-white">
                          <SelectValue placeholder="No visibility condition" />
                        </SelectTrigger>
                        <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
                          <SelectItem value="none">Always visible</SelectItem>
                          {sortedFields.map((candidate) => (
                            <SelectItem key={candidate.id} value={candidate.id}>
                              {candidate.label || "Untitled field"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={section.visibility?.operator ?? "equals"}
                        onValueChange={(value) => {
                          const current = section.visibility ?? emptyVisibilityRule();
                          updateSection(section.id, "visibility", {
                            ...current,
                            operator: value as VisibilityOperator,
                          });
                        }}
                        disabled={!section.visibility}
                      >
                        <SelectTrigger className="border-[var(--ghost-border)] bg-midnight text-ice-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="is_checked">Is checked</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={section.visibility?.value ?? ""}
                        onChange={(e) => {
                          const current = section.visibility ?? emptyVisibilityRule();
                          updateSection(section.id, "visibility", {
                            ...current,
                            value: e.target.value,
                          });
                        }}
                        disabled={!section.visibility || section.visibility.operator === "is_checked"}
                        placeholder="Condition value"
                        className="border-[var(--ghost-border)] bg-midnight text-ice-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] uppercase tracking-wider text-steel-gray">Fields</p>
                        <div className="flex items-center gap-1">
                          {FORM_FIELD_TYPE_OPTIONS.map((ft) => (
                            <Button
                              key={`${section.id}-${ft.type}`}
                              type="button"
                              onClick={() => addField(ft.type, section.id)}
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

                      {sectionFields.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[var(--ghost-border)] p-4 text-center text-xs text-steel-gray">
                          No fields in this section yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {sectionFields.map((field) => (
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
                                <span className="text-xs text-ice-white flex-1">
                                  {field.label || <span className="italic text-steel-gray/50">Untitled</span>}
                                  {field.required && <span className="text-signal-orange ml-1">*</span>}
                                </span>
                                <span className="text-[10px] text-steel-gray/50 uppercase">{field.type}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveField(field.id, "up");
                                  }}
                                >
                                  <ChevronUp size={11} />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveField(field.id, "down");
                                  }}
                                >
                                  <ChevronDown size={11} />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateField(field);
                                  }}
                                >
                                  <Copy size={11} />
                                </Button>
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
                                  className="mt-3 pt-3 border-t border-[var(--ghost-border)] grid gap-3 md:grid-cols-2"
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
                                    <label className="text-[10px] text-steel-gray">Section</label>
                                    <Select
                                      value={field.sectionId}
                                      onValueChange={(value) => updateField(field.id, "sectionId", value)}
                                    >
                                      <SelectTrigger className="h-8 border-[var(--ghost-border)] bg-midnight text-xs text-ice-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
                                        {sortedSections.map((sectionOption) => (
                                          <SelectItem key={sectionOption.id} value={sectionOption.id}>
                                            {sectionOption.title}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
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
                                  <div className="space-y-1">
                                    <label className="text-[10px] text-steel-gray">Helper Text</label>
                                    <Input
                                      type="text"
                                      value={field.config?.helperText ?? ""}
                                      onChange={(e) =>
                                        updateField(field.id, "config", {
                                          ...(field.config ?? {}),
                                          helperText: e.target.value,
                                        })
                                      }
                                      className="h-8 border-[var(--ghost-border)] bg-midnight text-xs text-ice-white"
                                    />
                                  </div>
                                  {field.type === "select" && (
                                    <div className="md:col-span-2 space-y-1">
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
                                  <div className="md:col-span-2 grid gap-2 sm:grid-cols-[1fr,140px,1fr]">
                                    <Select
                                      value={(field.visibility?.sourceFieldId as string) || "none"}
                                      onValueChange={(value) => {
                                        if (value === "none") {
                                          updateField(field.id, "visibility", null);
                                          return;
                                        }
                                        const current = field.visibility ?? emptyVisibilityRule();
                                        updateField(field.id, "visibility", {
                                          ...current,
                                          sourceFieldId: value,
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="h-8 border-[var(--ghost-border)] bg-midnight text-xs text-ice-white">
                                        <SelectValue placeholder="No condition" />
                                      </SelectTrigger>
                                      <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
                                        <SelectItem value="none">Always visible</SelectItem>
                                        {sortedFields
                                          .filter((candidate) => candidate.id !== field.id)
                                          .map((candidate) => (
                                            <SelectItem key={candidate.id} value={candidate.id}>
                                              {candidate.label || "Untitled field"}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                    <Select
                                      value={field.visibility?.operator ?? "equals"}
                                      onValueChange={(value) => {
                                        const current = field.visibility ?? emptyVisibilityRule();
                                        updateField(field.id, "visibility", {
                                          ...current,
                                          operator: value as VisibilityOperator,
                                        });
                                      }}
                                      disabled={!field.visibility}
                                    >
                                      <SelectTrigger className="h-8 border-[var(--ghost-border)] bg-midnight text-xs text-ice-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
                                        <SelectItem value="equals">Equals</SelectItem>
                                        <SelectItem value="contains">Contains</SelectItem>
                                        <SelectItem value="is_checked">Is checked</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      value={field.visibility?.value ?? ""}
                                      onChange={(e) => {
                                        const current = field.visibility ?? emptyVisibilityRule();
                                        updateField(field.id, "visibility", {
                                          ...current,
                                          value: e.target.value,
                                        });
                                      }}
                                      disabled={!field.visibility || field.visibility.operator === "is_checked"}
                                      placeholder="Condition value"
                                      className="h-8 border-[var(--ghost-border)] bg-midnight text-xs text-ice-white"
                                    />
                                  </div>
                                  {field.type === "file" && (
                                    <div className="md:col-span-2 grid gap-2 sm:grid-cols-2">
                                      <div className="space-y-1">
                                        <label className="text-[10px] text-steel-gray">Accepted MIME list</label>
                                        <Input
                                          value={(field.config?.file?.accept ?? FILE_ACCEPT_DEFAULT.split(",")).join(",")}
                                          onChange={(e) =>
                                            updateField(field.id, "config", {
                                              ...(field.config ?? {}),
                                              file: {
                                                accept: e.target.value
                                                  .split(",")
                                                  .map((item) => item.trim())
                                                  .filter(Boolean),
                                                maxSizeBytes:
                                                  field.config?.file?.maxSizeBytes ??
                                                  APPLICATION_MAX_UPLOAD_BYTES,
                                              },
                                            })
                                          }
                                          className="h-8 border-[var(--ghost-border)] bg-midnight text-xs text-ice-white"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] text-steel-gray">Max size (MB)</label>
                                        <Input
                                          type="number"
                                          min={1}
                                          value={Math.ceil((field.config?.file?.maxSizeBytes ?? APPLICATION_MAX_UPLOAD_BYTES) / (1024 * 1024))}
                                          onChange={(e) =>
                                            updateField(field.id, "config", {
                                              ...(field.config ?? {}),
                                              file: {
                                                accept:
                                                  field.config?.file?.accept ?? FILE_ACCEPT_DEFAULT.split(","),
                                                maxSizeBytes:
                                                  Math.max(1, Number.parseInt(e.target.value || "10", 10)) *
                                                  1024 *
                                                  1024,
                                              },
                                            })
                                          }
                                          className="h-8 border-[var(--ghost-border)] bg-midnight text-xs text-ice-white"
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <label className="md:col-span-2 flex items-center gap-2 cursor-pointer">
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
                  </div>
                );
              })}
            </div>

            <div className="glass-card p-5 space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-steel-gray">
                Live Preview
              </h3>
              <p className="text-xs text-steel-gray">
                Visibility preview uses sample values.
              </p>
              <div className="space-y-3">
                {sortedSections.map((section) => {
                  const previewValues = Object.fromEntries(
                    sortedFields.map((field) => [field.id, field.type === "checkbox" ? "true" : "sample"])
                  );
                  const sectionVisible = isVisibilityRuleSatisfied(
                    section.visibility ?? undefined,
                    previewValues
                  );
                  const visibleFields = (sectionFieldMap.get(section.id) ?? []).filter((field) =>
                    isVisibilityRuleSatisfied(field.visibility ?? undefined, previewValues)
                  );
                  return (
                    <div
                      key={`preview-${section.id}`}
                      className={`rounded-lg border px-3 py-2 ${
                        sectionVisible
                          ? "border-[var(--ghost-border)] bg-midnight-light"
                          : "border-amber-500/30 bg-amber-500/10"
                      }`}
                    >
                      <p className="text-sm text-ice-white">{section.title || "Untitled section"}</p>
                      {!sectionVisible ? (
                        <p className="text-[11px] text-amber-300 mt-1">Hidden by section condition.</p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {visibleFields.length === 0 ? (
                            <li className="text-[11px] text-steel-gray">No visible fields.</li>
                          ) : (
                            visibleFields.map((field) => (
                              <li key={`preview-field-${field.id}`} className="text-[11px] text-steel-gray">
                                {field.label || "Untitled"} - {field.type}
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {isEditMode && (
          <TabsContent value="applications" className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm text-steel-gray">{applications.length} applications</p>
                <p className="text-xs text-steel-gray/80">
                  Open any row to review and apply workflow actions.
                </p>
              </div>
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
              rows={applications}
              showEventColumn={false}
              emptyMessage="No applications found for this event."
              getRowHref={(row) =>
                `/admin/applications/${row.id}?returnTo=${encodeURIComponent(`${pathname}?tab=applications`)}`
              }
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
