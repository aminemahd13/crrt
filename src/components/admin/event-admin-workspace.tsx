"use client";

import { useMemo, useRef, useState } from "react";
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
  Search,
  ToggleLeft,
  Trash2,
  Type,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublishChecklist } from "@/components/admin/publish-checklist";
import type {
  ApplicantRow,
  EventAdminTab,
  RegistrationField,
  RegistrationStatus,
  ReviewQueueRow,
  ReviewSubmissionStatus,
} from "@/components/admin/events-admin-types";

interface EventAdminWorkspaceProps {
  mode: "create" | "edit";
  initialData: Record<string, unknown>;
  initialRegistrationFields?: RegistrationField[];
  initialRegistrations?: ApplicantRow[];
  initialReviewQueue?: ReviewQueueRow[];
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

const REGISTRATION_STATUS_OPTIONS: RegistrationStatus[] = [
  "registered",
  "waitlisted",
  "approved",
  "rejected",
  "cancelled",
];

const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  registered: "Registered",
  waitlisted: "Waitlisted",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const REVIEW_STATUS_OPTIONS: ReviewSubmissionStatus[] = [
  "new",
  "in_review",
  "accepted",
  "rejected",
];

const REVIEW_STATUS_LABELS: Record<ReviewSubmissionStatus, string> = {
  new: "New",
  in_review: "In Review",
  accepted: "Accepted",
  rejected: "Rejected",
};

function normalizeEventAdminTab(value: string | null | undefined, mode: "create" | "edit"): EventAdminTab {
  const fallback: EventAdminTab = "details";
  if (!value) return fallback;

  if (
    value === "details" ||
    value === "registration" ||
    value === "form-builder" ||
    value === "applicants" ||
    value === "review-queue"
  ) {
    if (mode === "create" && (value === "applicants" || value === "review-queue")) {
      return fallback;
    }
    return value;
  }
  return fallback;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EventAdminWorkspace({
  mode,
  initialData,
  initialRegistrationFields = [],
  initialRegistrations = [],
  initialReviewQueue = [],
  initialTab,
}: EventAdminWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<Record<string, unknown>>(initialData);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<RegistrationField[]>(initialRegistrationFields);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<ApplicantRow[]>(initialRegistrations);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueRow[]>(initialReviewQueue);
  const [applicantQuery, setApplicantQuery] = useState("");
  const [applicantStatusFilter, setApplicantStatusFilter] = useState<RegistrationStatus | "all">("all");
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [updatingApplicantId, setUpdatingApplicantId] = useState<string | null>(null);
  const [reviewQuery, setReviewQuery] = useState("");
  const [reviewStatusFilter, setReviewStatusFilter] = useState<ReviewSubmissionStatus | "all">("all");
  const [updatingSubmissionId, setUpdatingSubmissionId] = useState<string | null>(null);
  const counterRef = useRef(initialRegistrationFields.length);
  const isEditMode = mode === "edit";
  const eventId = typeof form.id === "string" ? form.id : "";
  const activeTab = normalizeEventAdminTab(searchParams.get("tab") ?? initialTab, mode);

  const filteredApplicants = useMemo(() => {
    return applicants.filter((item) => {
      if (applicantStatusFilter !== "all" && item.status !== applicantStatusFilter) return false;
      const haystack = `${item.userName ?? ""} ${item.userEmail ?? ""}`.toLowerCase();
      return haystack.includes(applicantQuery.toLowerCase());
    });
  }, [applicantQuery, applicantStatusFilter, applicants]);

  const filteredReviewQueue = useMemo(() => {
    return reviewQueue.filter((item) => {
      if (reviewStatusFilter !== "all" && item.status !== reviewStatusFilter) return false;
      const dataText = Object.values(item.data).join(" ");
      const haystack = `${item.eventTitle} ${item.applicantName ?? ""} ${item.applicantEmail ?? ""} ${dataText}`.toLowerCase();
      return haystack.includes(reviewQuery.toLowerCase());
    });
  }, [reviewQuery, reviewQueue, reviewStatusFilter]);

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
        alert(payload.error || "Failed to save event.");
        return;
      }

      router.push("/admin/events");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleApplicantStatusUpdate = async (registrationId: string, status: RegistrationStatus) => {
    if (!eventId) return;
    setUpdatingApplicantId(registrationId);

    const note = noteDraft[registrationId] ?? "";
    const response = await fetch(`/api/admin/events/${eventId}/registrations/${registrationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });

    if (response.ok) {
      const updated = (await response.json()) as {
        id: string;
        status: RegistrationStatus;
        note: string | null;
        updatedAt: string;
      };

      setApplicants((prev) =>
        prev.map((item) =>
          item.id === registrationId
            ? {
                ...item,
                status: updated.status,
                note: updated.note,
                updatedAt: updated.updatedAt,
              }
            : item
        )
      );
    }

    setUpdatingApplicantId(null);
  };

  const handleSubmissionStatusUpdate = async (
    submissionId: string,
    status: ReviewSubmissionStatus
  ) => {
    setUpdatingSubmissionId(submissionId);

    const response = await fetch(`/api/admin/submissions/${submissionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      const updated = (await response.json()) as {
        id: string;
        status: ReviewSubmissionStatus;
        updatedAt?: string;
      };
      setReviewQueue((prev) =>
        prev.map((item) =>
          item.id === submissionId
            ? {
                ...item,
                status: updated.status,
                updatedAt:
                  typeof updated.updatedAt === "string" ? updated.updatedAt : item.updatedAt,
              }
            : item
        )
      );
    }

    setUpdatingSubmissionId(null);
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
        <input
          data-testid={`event-field-${field.key}`}
          type="text"
          value={typeof form[field.key] === "string" ? (form[field.key] as string) : ""}
          onChange={(e) => update(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white placeholder:text-steel-gray focus:border-signal-orange/30 focus:outline-none"
        />
      )}

      {field.type === "textarea" && (
        <textarea
          data-testid={`event-field-${field.key}`}
          value={typeof form[field.key] === "string" ? (form[field.key] as string) : ""}
          onChange={(e) => update(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={field.key === "content" ? 12 : 3}
          className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white placeholder:text-steel-gray focus:border-signal-orange/30 focus:outline-none resize-y font-mono"
        />
      )}

      {field.type === "select" && (
        <select
          data-testid={`event-field-${field.key}`}
          value={typeof form[field.key] === "string" ? (form[field.key] as string) : ""}
          onChange={(e) => update(field.key, e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {field.type === "number" && (
        <input
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
          className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
        />
      )}

      {field.type === "datetime" && (
        <input
          data-testid={`event-field-${field.key}`}
          type="datetime-local"
          value={typeof form[field.key] === "string" ? (form[field.key] as string) : ""}
          onChange={(e) => update(field.key, e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
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
          <button
            onClick={() => update("published", !published)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-colors ${
              published
                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                : "border-[var(--ghost-border)] text-steel-gray hover:text-ice-white"
            }`}
          >
            {published ? <Eye size={12} /> : <EyeOff size={12} />}
            {published ? "Published" : "Draft"}
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
              value="applicants"
              className="data-[state=active]:bg-signal-orange data-[state=active]:text-white"
            >
              Applicants
            </TabsTrigger>
          )}
          {isEditMode && (
            <TabsTrigger
              value="review-queue"
              className="data-[state=active]:bg-signal-orange data-[state=active]:text-white"
            >
              Review Queue
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
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(field.id);
                        }}
                        className="p-1 text-steel-gray/30 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {editingFieldId === field.id && (
                      <div
                        className="mt-3 pt-3 border-t border-[var(--ghost-border)] grid grid-cols-2 gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                            <label className="text-[10px] text-steel-gray">
                              Options (comma-separated)
                            </label>
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
        </TabsContent>

        {isEditMode && (
          <TabsContent value="applicants" className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-steel-gray">{applicants.length} applicants</div>
              {csvHref && (
                <a
                  href={csvHref}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--ghost-border)] text-xs text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
                >
                  <Download size={13} /> Export CSV
                </a>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-gray"
                />
                <input
                  type="text"
                  value={applicantQuery}
                  onChange={(e) => setApplicantQuery(e.target.value)}
                  placeholder="Search by member name or email..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-midnight-light border border-[var(--ghost-border)] text-sm text-ice-white"
                />
              </div>
              <select
                value={applicantStatusFilter}
                onChange={(e) =>
                  setApplicantStatusFilter(e.target.value as RegistrationStatus | "all")
                }
                className="px-3 py-2.5 rounded-lg bg-midnight-light border border-[var(--ghost-border)] text-xs text-ice-white"
              >
                <option value="all">All statuses</option>
                {REGISTRATION_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {REGISTRATION_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--ghost-border)] text-left text-xs text-steel-gray uppercase tracking-wider">
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--ghost-border)] last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-sm text-ice-white">{item.userName || "Unnamed Member"}</p>
                        <p className="text-xs text-steel-gray">{item.userEmail || "No email"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-ice-white">
                          {REGISTRATION_STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={noteDraft[item.id] ?? item.note ?? ""}
                          onChange={(e) =>
                            setNoteDraft((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder="Optional moderation note"
                          className="w-full px-2 py-1.5 rounded-md bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white"
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-steel-gray">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {REGISTRATION_STATUS_OPTIONS.map((status) => (
                            <button
                              key={status}
                              onClick={() => handleApplicantStatusUpdate(item.id, status)}
                              disabled={updatingApplicantId === item.id || item.status === status}
                              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                                item.status === status
                                  ? "bg-signal-orange/10 border-signal-orange/30 text-signal-orange"
                                  : "border-[var(--ghost-border)] text-steel-gray hover:text-ice-white hover:bg-white/5"
                              }`}
                            >
                              {REGISTRATION_STATUS_LABELS[status]}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredApplicants.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-steel-gray">
                        No applicants found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        )}

        {isEditMode && (
          <TabsContent value="review-queue" className="mt-4 space-y-4">
            <div className="text-sm text-steel-gray">{reviewQueue.length} submissions</div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-gray"
                />
                <input
                  type="text"
                  value={reviewQuery}
                  onChange={(e) => setReviewQuery(e.target.value)}
                  placeholder="Search submissions..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-midnight-light border border-[var(--ghost-border)] text-sm text-ice-white"
                />
              </div>
              <select
                value={reviewStatusFilter}
                onChange={(e) =>
                  setReviewStatusFilter(e.target.value as ReviewSubmissionStatus | "all")
                }
                className="px-3 py-2.5 rounded-lg bg-midnight-light border border-[var(--ghost-border)] text-xs text-ice-white"
              >
                <option value="all">All statuses</option>
                {REVIEW_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {REVIEW_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--ghost-border)] text-left text-xs text-steel-gray uppercase tracking-wider">
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Submission</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Registration</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviewQueue.map((item) => {
                    const preview = Object.entries(item.data)
                      .slice(0, 2)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" | ");

                    return (
                      <tr
                        key={item.id}
                        data-testid="review-row"
                        data-status={item.status}
                        className="border-b border-[var(--ghost-border)] last:border-0"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm text-ice-white">{item.applicantName || "Unknown user"}</p>
                          <p className="text-xs text-steel-gray">{item.applicantEmail || "No email"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-ice-white">{preview || "No fields submitted"}</p>
                          <p className="text-[10px] text-steel-gray mt-1">
                            Submitted: {formatDate(item.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-ice-white">{REVIEW_STATUS_LABELS[item.status]}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-steel-gray">
                            {item.registrationStatus
                              ? REGISTRATION_STATUS_LABELS[item.registrationStatus]
                              : "No registration"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {REVIEW_STATUS_OPTIONS.map((status) => (
                              <button
                                key={status}
                                aria-label={`Set ${status}`}
                                onClick={() => handleSubmissionStatusUpdate(item.id, status)}
                                disabled={updatingSubmissionId === item.id || item.status === status}
                                className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                                  item.status === status
                                    ? "bg-signal-orange/10 border-signal-orange/30 text-signal-orange"
                                    : "border-[var(--ghost-border)] text-steel-gray hover:text-ice-white hover:bg-white/5"
                                }`}
                              >
                                {REVIEW_STATUS_LABELS[status]}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredReviewQueue.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-steel-gray">
                        No review items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
