"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  ClipboardCheck,
  FileText,
  Loader2,
  MapPin,
  Upload,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { getEventThemeStyles } from "@/lib/event-config";
import {
  clearEventApplyDraft,
  createEventApplyDraftKey,
  loadEventApplyStructuredDraft,
  saveEventApplyStructuredDraft,
  validateApplyRequiredFields,
} from "@/lib/event-apply-draft";
import { registrationStatusLabel } from "@/lib/event-registration";
import { APPLICATION_MAX_UPLOAD_BYTES } from "@/lib/file-upload-policy";
import type { FileAnswerValue, SubmissionDataV2 } from "@/lib/form-submission";
import { isVisibilityRuleSatisfied, type VisibilityRule } from "@/lib/form-visibility";

type RegistrationStatus = "registered" | "waitlisted" | "approved" | "rejected" | "cancelled";

interface EventFormSection {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  visibility?: VisibilityRule | null;
}

interface EventFormFieldConfig {
  helperText?: string;
  file?: {
    accept?: string[];
    maxSizeBytes?: number;
  };
}

interface EventFormField {
  id: string;
  sectionId?: string | null;
  label: string;
  type: string;
  required: boolean;
  placeholder: string | null;
  options: unknown;
  visibility?: VisibilityRule | null;
  config?: EventFormFieldConfig | null;
}

interface EventApplyClientProps {
  event: {
    id: string;
    title: string;
    slug: string;
    description: string;
    startDate: string;
    endDate: string | null;
    location: string | null;
    capacity: number | null;
    type: string;
    themePreset?: string | null;
    themeAccent?: string | null;
    registrationLabel?: string | null;
    registrationReviewMode?: string | null;
    activeRegistrationCount: number;
    tags: string[];
    formSections: EventFormSection[];
    formFields: EventFormField[];
  };
  auth: {
    isAuthenticated: boolean;
    userId: string | null;
  };
  userRegistration: {
    id: string;
    status: RegistrationStatus;
  } | null;
  userProfile: {
    name?: string;
    email?: string;
    phone?: string;
    organization?: string;
    city?: string;
  } | null;
}

const isActiveRegistration = (status: RegistrationStatus | undefined) =>
  status === "registered" || status === "approved" || status === "waitlisted";

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function getProfilePrefill(
  label: string,
  profile: EventApplyClientProps["userProfile"]
): string {
  if (!profile) return "";
  const key = label.toLowerCase();
  if (key.includes("name") && !key.includes("last")) return profile.name ?? "";
  if (key.includes("email") || key.includes("e-mail")) return profile.email ?? "";
  if (key.includes("phone") || key.includes("tel")) return profile.phone ?? "";
  if (
    key.includes("organi") ||
    key.includes("school") ||
    key.includes("university") ||
    key.includes("institution")
  ) {
    return profile.organization ?? "";
  }
  if (key.includes("city") || key.includes("ville")) return profile.city ?? "";
  return "";
}

function getFieldOptions(field: EventFormField): string[] {
  if (Array.isArray(field.options)) return field.options.map(String);
  if (typeof field.options === "string") {
    return field.options
      .split(",")
      .map((option) => option.trim())
      .filter(Boolean);
  }
  return [];
}

function getFieldMaxSize(field: EventFormField): number {
  const configured = field.config?.file?.maxSizeBytes;
  if (typeof configured === "number" && Number.isFinite(configured) && configured > 0) {
    return Math.floor(configured);
  }
  return APPLICATION_MAX_UPLOAD_BYTES;
}

function getFieldAcceptList(field: EventFormField): string[] {
  return Array.isArray(field.config?.file?.accept)
    ? field.config.file?.accept?.map((entry) => String(entry).trim()).filter(Boolean) ?? []
    : [];
}

function isAcceptedFile(file: File, acceptList: string[]): boolean {
  if (acceptList.length === 0) return true;
  const fileType = file.type.toLowerCase();
  const filename = file.name.toLowerCase();

  return acceptList.some((ruleRaw) => {
    const rule = ruleRaw.trim().toLowerCase();
    if (!rule) return false;
    if (rule.startsWith(".")) return filename.endsWith(rule);
    if (rule.endsWith("/*")) return fileType.startsWith(rule.slice(0, -1));
    return fileType === rule;
  });
}

export function EventApplyClient({
  event,
  auth,
  userRegistration,
  userProfile,
}: EventApplyClientProps) {
  const theme = getEventThemeStyles(event.themePreset, event.themeAccent);
  const dateStr = new Date(event.startDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = new Date(event.startDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const defaultValues = useMemo(() => {
    const initial: Record<string, string> = {};
    for (const field of event.formFields) {
      if (field.type === "file") continue;
      initial[field.id] = getProfilePrefill(field.label, userProfile);
    }
    return initial;
  }, [event.formFields, userProfile]);

  const [registration, setRegistration] = useState(userRegistration);
  const [activeRegistrationCount, setActiveRegistrationCount] = useState(event.activeRegistrationCount);
  const [formValues, setFormValues] = useState<Record<string, string>>(defaultValues);
  const [fileValues, setFileValues] = useState<Record<string, FileAnswerValue>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string>("Draft not saved yet");
  const [draftReady, setDraftReady] = useState(false);

  const hasFormFields = event.formFields.length > 0;
  const hasActive = isActiveRegistration(registration?.status);

  const sortedSections = useMemo(() => {
    const sections = [...event.formSections].sort((a, b) => a.order - b.order);
    if (sections.length > 0) return sections;
    return [
      {
        id: "default-section",
        title: "Application",
        description: "",
        order: 0,
        visibility: null,
      },
    ] satisfies EventFormSection[];
  }, [event.formSections]);

  const sectionFieldMap = useMemo(() => {
    const map = new Map<string, EventFormField[]>();
    const fallbackSectionId = sortedSections[0]?.id ?? "default-section";
    for (const section of sortedSections) {
      map.set(section.id, []);
    }

    for (const field of event.formFields) {
      const sectionId = field.sectionId ?? fallbackSectionId;
      const bucket = map.get(sectionId) ?? [];
      bucket.push(field);
      map.set(sectionId, bucket);
    }

    return map;
  }, [event.formFields, sortedSections]);

  const draftKey = useMemo(() => {
    if (!auth.userId || !hasFormFields) return null;
    return createEventApplyDraftKey(event.id, auth.userId, event.formFields);
  }, [auth.userId, event.id, event.formFields, hasFormFields]);

  const visibilityContext = useMemo(() => {
    const context: Record<string, unknown> = { ...formValues };
    for (const [fieldId, value] of Object.entries(fileValues)) {
      context[fieldId] = value.filename || value.url;
    }
    return context;
  }, [fileValues, formValues]);

  const visibleSections = useMemo(
    () =>
      sortedSections
        .map((section) => {
          const visible = isVisibilityRuleSatisfied(section.visibility ?? undefined, visibilityContext);
          const fields = (sectionFieldMap.get(section.id) ?? []).filter((field) =>
            isVisibilityRuleSatisfied(field.visibility ?? undefined, visibilityContext)
          );
          return {
            ...section,
            visible,
            fields,
          };
        })
        .filter((section) => section.visible),
    [sectionFieldMap, sortedSections, visibilityContext]
  );

  const visibleFields = useMemo(
    () => visibleSections.flatMap((section) => section.fields),
    [visibleSections]
  );

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!draftKey || !auth.isAuthenticated || !hasFormFields) {
      setDraftReady(true);
      return;
    }

    const draft = loadEventApplyStructuredDraft(window.localStorage, draftKey);
    if (draft) {
      setFormValues((prev) => ({ ...prev, ...draft.values }));
      setFileValues(draft.files);
      setDraftNotice("Draft restored");
    } else {
      setDraftNotice("Draft not found");
    }
    setDraftReady(true);
  }, [auth.isAuthenticated, draftKey, hasFormFields]);

  useEffect(() => {
    if (!draftReady || !draftKey || !auth.isAuthenticated || !hasFormFields || hasActive) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setDraftNotice("Saving draft...");

    saveTimeoutRef.current = setTimeout(() => {
      try {
        saveEventApplyStructuredDraft(window.localStorage, draftKey, {
          values: formValues,
          files: fileValues,
        });
        setDraftNotice(
          `Draft saved at ${new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        );
      } catch {
        setDraftNotice("Draft could not be saved");
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [auth.isAuthenticated, draftKey, draftReady, fileValues, formValues, hasActive, hasFormFields]);

  const discardDraft = () => {
    if (!draftKey) return;
    clearEventApplyDraft(window.localStorage, draftKey);
    setFormValues(defaultValues);
    setFileValues({});
    setFieldErrors({});
    setFileErrors({});
    setDraftNotice("Draft discarded");
  };

  const setFieldValue = (fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    setFieldErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const removeFile = (fieldId: string) => {
    setFileValues((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    setFieldValue(fieldId, "");
    setFileErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleFileUpload = async (field: EventFormField, file: File | null) => {
    if (!file) return;

    const maxSize = getFieldMaxSize(field);
    const acceptList = getFieldAcceptList(field);
    if (file.size > maxSize) {
      setFileErrors((prev) => ({
        ...prev,
        [field.id]: `Max file size is ${formatFileSize(maxSize)}.`,
      }));
      return;
    }

    if (!isAcceptedFile(file, acceptList)) {
      setFileErrors((prev) => ({
        ...prev,
        [field.id]: "Unsupported file type for this field.",
      }));
      return;
    }

    setUploadingFieldId(field.id);
    setSubmissionError(null);
    setFileErrors((prev) => {
      const next = { ...prev };
      delete next[field.id];
      return next;
    });

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch(`/api/events/${event.id}/uploads`, {
        method: "POST",
        body,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      } & FileAnswerValue;

      if (!response.ok) {
        setFileErrors((prev) => ({
          ...prev,
          [field.id]: payload.error ?? "Failed to upload file.",
        }));
        return;
      }

      const uploadedFile: FileAnswerValue = {
        url: payload.url,
        filename: payload.filename,
        mimeType: payload.mimeType,
        size: payload.size,
      };
      setFileValues((prev) => ({ ...prev, [field.id]: uploadedFile }));
      setFieldValue(field.id, uploadedFile.filename);
    } catch {
      setFileErrors((prev) => ({
        ...prev,
        [field.id]: "Failed to upload file.",
      }));
    } finally {
      setUploadingFieldId(null);
    }
  };

  const handleSubmit = async () => {
    setSubmissionError(null);
    setFieldErrors({});
    setFileErrors({});

    if (hasFormFields) {
      const requiredErrors = validateApplyRequiredFields(
        visibleFields.map((field) => ({
          id: field.id,
          label: field.label,
          required: field.required,
        })),
        formValues,
        fileValues
      );
      if (Object.keys(requiredErrors).length > 0) {
        const nextFieldErrors: Record<string, string> = {};
        for (const field of visibleFields) {
          const message = requiredErrors[field.label];
          if (message) nextFieldErrors[field.id] = message;
        }
        setFieldErrors(nextFieldErrors);
        return;
      }
    }

    const answers: SubmissionDataV2["answers"] = {};
    for (const field of event.formFields) {
      const fileValue = fileValues[field.id];
      if (fileValue) {
        answers[field.id] = { type: field.type, value: fileValue };
        continue;
      }

      const value = formValues[field.id];
      if (typeof value === "string" && value.trim().length > 0) {
        answers[field.id] = { type: field.type, value: value.trim() };
      }
    }

    const structuredPayload: SubmissionDataV2 = {
      schemaVersion: 2,
      answers,
      legacy: { unmapped: {} },
    };

    setIsPending(true);
    try {
      const response = await fetch(`/api/events/${event.id}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: hasFormFields ? structuredPayload : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setSubmissionError(payload.error || "Failed to submit application.");
        if (Array.isArray(payload.missingFields)) {
          const missingById: Record<string, string> = {};
          for (const field of visibleFields) {
            if (payload.missingFields.includes(field.label)) {
              missingById[field.id] = `${field.label} is required`;
            }
          }
          if (Object.keys(missingById).length > 0) {
            setFieldErrors(missingById);
          }
        }
        return;
      }

      const previousStatus = registration?.status;
      const nextStatus = payload.status as RegistrationStatus;
      setRegistration({ id: payload.id as string, status: nextStatus });

      const wasActive = isActiveRegistration(previousStatus);
      const nowActive = isActiveRegistration(nextStatus);
      if (!wasActive && nowActive) {
        setActiveRegistrationCount((prev) => prev + 1);
      }

      if (draftKey) {
        clearEventApplyDraft(window.localStorage, draftKey);
        setDraftNotice("Draft cleared after submit");
      }
    } catch {
      setSubmissionError("Failed to submit application.");
    } finally {
      setIsPending(false);
    }
  };

  const handleCancel = async () => {
    if (!registration) return;

    setSubmissionError(null);
    setIsPending(true);
    try {
      const response = await fetch(`/api/events/registrations/${registration.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        setSubmissionError(payload.error || "Failed to cancel registration.");
        return;
      }

      const wasActive = isActiveRegistration(registration.status);
      setRegistration({ id: payload.id as string, status: payload.status as RegistrationStatus });
      if (wasActive) {
        setActiveRegistrationCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      setSubmissionError("Failed to cancel registration.");
    } finally {
      setIsPending(false);
    }
  };

  const renderField = (field: EventFormField) => {
    const helperText = typeof field.config?.helperText === "string" ? field.config.helperText : "";
    const error = fieldErrors[field.id] || fileErrors[field.id];

    if (field.type === "file") {
      const fileValue = fileValues[field.id];
      const acceptList = getFieldAcceptList(field);
      const maxSize = getFieldMaxSize(field);
      const isUploading = uploadingFieldId === field.id;

      return (
        <div key={field.id} className="space-y-1.5">
          <label className="text-xs text-steel-gray">
            {field.label}
            {field.required ? <span className="ml-0.5 text-signal-orange">*</span> : null}
          </label>
          {helperText ? <p className="text-[11px] text-steel-gray/80">{helperText}</p> : null}

          <div className="rounded-lg border border-[var(--ghost-border)] bg-[var(--ghost-white)] p-3 space-y-2">
            {fileValue ? (
              <div className="rounded-md border border-[var(--ghost-border)] bg-midnight-light px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-ice-white">{fileValue.filename}</p>
                    <p className="text-[11px] text-steel-gray">{formatFileSize(fileValue.size)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={fileValue.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded border border-[var(--ghost-border)] px-2 py-1 text-[10px] text-steel-gray hover:bg-white/5 hover:text-ice-white"
                    >
                      <FileText size={11} /> Open
                    </a>
                    <button
                      type="button"
                      onClick={() => removeFile(field.id)}
                      className="inline-flex items-center gap-1 rounded border border-red-500/30 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/10"
                    >
                      <X size={11} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <Input
              type="file"
              accept={acceptList.join(",")}
              disabled={isPending || isUploading}
              onChange={(e) => {
                const nextFile = e.currentTarget.files?.[0] ?? null;
                void handleFileUpload(field, nextFile);
                e.currentTarget.value = "";
              }}
              className="border-[var(--ghost-border)] bg-midnight text-ice-white file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-ice-white"
            />
            <p className="text-[11px] text-steel-gray">
              Max {formatFileSize(maxSize)}
              {acceptList.length > 0 ? ` - ${acceptList.join(", ")}` : ""}
            </p>
            {isUploading ? (
              <div className="space-y-1">
                <p className="flex items-center gap-1 text-[11px] text-steel-gray">
                  <Loader2 size={12} className="animate-spin" /> Uploading...
                </p>
                <div className="h-1 overflow-hidden rounded bg-midnight">
                  <div className="h-full w-1/2 animate-pulse bg-signal-orange" />
                </div>
              </div>
            ) : (
              <p className="flex items-center gap-1 text-[11px] text-steel-gray">
                <Upload size={12} />
                {fileValue ? "Replace file if needed." : "Upload one file."}
              </p>
            )}
          </div>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-1.5">
        <label className="text-xs text-steel-gray">
          {field.label}
          {field.required ? <span className="ml-0.5 text-signal-orange">*</span> : null}
        </label>
        {helperText ? <p className="text-[11px] text-steel-gray/80">{helperText}</p> : null}
        {field.type === "textarea" ? (
          <Textarea
            rows={4}
            placeholder={field.placeholder ?? ""}
            value={formValues[field.id] ?? ""}
            onChange={(e) => setFieldValue(field.id, e.target.value)}
            className="border-[var(--ghost-border)] bg-[var(--ghost-white)] text-ice-white placeholder:text-steel-gray/60"
          />
        ) : field.type === "select" ? (
          <Select
            value={formValues[field.id] || undefined}
            onValueChange={(value) => setFieldValue(field.id, value)}
          >
            <SelectTrigger className="w-full border-[var(--ghost-border)] bg-[var(--ghost-white)] text-ice-white">
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
              {getFieldOptions(field).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === "checkbox" ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ice-white">
            <Checkbox
              checked={formValues[field.id] === "true"}
              onCheckedChange={(checked) => setFieldValue(field.id, checked === true ? "true" : "")}
            />
            {field.placeholder || field.label}
          </label>
        ) : (
          <Input
            type={
              field.type === "number"
                ? "number"
                : field.type === "date"
                  ? "date"
                  : field.type === "email"
                    ? "email"
                    : "text"
            }
            placeholder={field.placeholder ?? ""}
            value={formValues[field.id] ?? ""}
            onChange={(e) => setFieldValue(field.id, e.target.value)}
            className="border-[var(--ghost-border)] bg-[var(--ghost-white)] text-ice-white placeholder:text-steel-gray/60"
          />
        )}
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>
    );
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-12" style={theme.scopeStyle}>
      <Link
        href={`/events/${event.slug}`}
        className="mb-8 inline-flex items-center gap-2 text-sm text-steel-gray transition-colors hover:text-ice-white"
      >
        <ArrowLeft size={16} /> Back to Event
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card space-y-4 p-6"
          >
            <span
              style={theme.badgeStyle}
              className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider"
            >
              {event.type}
            </span>
            <h1 className="font-heading text-3xl font-bold text-ice-white">
              Apply to {event.title}
            </h1>
            <p className="text-sm leading-relaxed text-steel-gray">{event.description}</p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar size={16} className="mt-0.5" style={theme.iconStyle} />
                <div>
                  <p className="text-sm text-ice-white">{dateStr}</p>
                  <p className="text-xs text-steel-gray">{timeStr}</p>
                </div>
              </div>
              {event.location ? (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5" style={theme.iconStyle} />
                  <p className="text-sm text-ice-white">{event.location}</p>
                </div>
              ) : null}
              {event.capacity ? (
                <div className="flex items-start gap-3">
                  <Users size={16} className="mt-0.5" style={theme.iconStyle} />
                  <p className="text-sm text-ice-white">
                    {event.capacity} spots - {activeRegistrationCount} active
                  </p>
                </div>
              ) : null}
            </div>

            {event.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {event.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="border-[var(--ghost-border)] bg-[var(--ghost-white)] text-[10px] text-steel-gray"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card space-y-4 p-6 lg:col-span-3"
        >
          <h2 className="font-heading text-xl font-semibold text-ice-white">Application</h2>

          {!auth.isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-sm text-steel-gray">
                Sign in or create an account to complete your application.
              </p>
              <Link
                href={`/signup?callbackUrl=${encodeURIComponent(`/events/${event.slug}/apply`)}`}
                style={theme.buttonStyle}
                className="block w-full rounded-xl py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Create Account to Apply
              </Link>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/events/${event.slug}/apply`)}`}
                style={theme.buttonSubtleStyle}
                className="block w-full rounded-xl border py-2.5 text-center text-sm font-medium"
              >
                Already a member? Sign In
              </Link>
            </div>
          ) : hasActive && registration ? (
            <div className="space-y-3">
              <Button
                type="button"
                disabled
                variant="outline"
                style={theme.buttonSubtleStyle}
                className="h-auto w-full rounded-xl border py-3 text-sm font-medium"
              >
                {registrationStatusLabel(registration.status)}
              </Button>
              {event.registrationReviewMode === "manual" && registration.status === "registered" ? (
                <p className="flex items-center justify-center gap-1 text-xs text-steel-gray">
                  <ClipboardCheck size={12} /> Your application is pending review
                </p>
              ) : null}
              <Button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                variant="outline"
                className="h-auto w-full rounded-xl border-[var(--ghost-border)] py-2.5 text-sm text-steel-gray hover:bg-white/5 hover:text-ice-white"
              >
                {isPending ? "Updating..." : "Cancel Registration"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {hasFormFields ? (
                <>
                  {visibleSections.map((section) => (
                    <div
                      key={section.id}
                      className="rounded-xl border border-[var(--ghost-border)] bg-midnight-light/30 p-4 space-y-3"
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-ice-white">
                          {section.title || "Application Section"}
                        </h3>
                        {section.description ? (
                          <p className="text-xs text-steel-gray mt-1">{section.description}</p>
                        ) : null}
                      </div>
                      <div className="space-y-3">{section.fields.map((field) => renderField(field))}</div>
                    </div>
                  ))}
                  {draftKey ? (
                    <div className="flex items-center justify-between rounded-lg border border-[var(--ghost-border)] bg-midnight-light px-3 py-2">
                      <p className="text-xs text-steel-gray">{draftNotice}</p>
                      <Button
                        type="button"
                        onClick={discardDraft}
                        variant="ghost"
                        className="h-auto p-0 text-xs text-steel-gray hover:bg-transparent hover:text-ice-white"
                      >
                        Discard draft
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="rounded-lg border border-[var(--ghost-border)] bg-midnight-light px-3 py-2 text-sm text-steel-gray">
                  This event does not require additional form fields. Submit your application to register.
                </p>
              )}

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || Boolean(uploadingFieldId)}
                style={theme.buttonStyle}
                data-testid="event-apply-submit"
                className="h-auto w-full rounded-xl py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isPending
                  ? "Submitting..."
                  : event.registrationLabel?.trim() || "Submit Application"}
              </Button>
            </div>
          )}

          {submissionError ? (
            <Alert variant="destructive" className="border-red-500/20 bg-red-500/10">
              <AlertDescription className="text-xs text-red-400">
                {submissionError}
              </AlertDescription>
            </Alert>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
