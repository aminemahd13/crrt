"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ClipboardCheck, MapPin, Users } from "lucide-react";
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
  loadEventApplyDraft,
  saveEventApplyDraft,
  validateApplyRequiredFields,
} from "@/lib/event-apply-draft";
import { registrationStatusLabel } from "@/lib/event-registration";

type RegistrationStatus = "registered" | "waitlisted" | "approved" | "rejected" | "cancelled";

interface EventFormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string | null;
  options: unknown;
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

const isActiveRegistration = (status: RegistrationStatus | undefined) =>
  status === "registered" || status === "approved" || status === "waitlisted";

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
      initial[field.label] = getProfilePrefill(field.label, userProfile);
    }
    return initial;
  }, [event.formFields, userProfile]);

  const [registration, setRegistration] = useState(userRegistration);
  const [activeRegistrationCount, setActiveRegistrationCount] = useState(event.activeRegistrationCount);
  const [formValues, setFormValues] = useState<Record<string, string>>(defaultValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, setIsPending] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string>("Draft not saved yet");
  const [draftReady, setDraftReady] = useState(false);

  const hasFormFields = event.formFields.length > 0;
  const hasActive = isActiveRegistration(registration?.status);

  const draftKey = useMemo(() => {
    if (!auth.userId || !hasFormFields) return null;
    return createEventApplyDraftKey(event.id, auth.userId, event.formFields);
  }, [auth.userId, event.id, event.formFields, hasFormFields]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!draftKey || !auth.isAuthenticated || !hasFormFields) {
      setDraftReady(true);
      return;
    }

    const draft = loadEventApplyDraft(window.localStorage, draftKey);
    if (draft) {
      setFormValues((prev) => ({ ...prev, ...draft }));
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
        saveEventApplyDraft(window.localStorage, draftKey, formValues);
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
  }, [auth.isAuthenticated, draftKey, draftReady, formValues, hasActive, hasFormFields]);

  const discardDraft = () => {
    if (!draftKey) return;
    clearEventApplyDraft(window.localStorage, draftKey);
    setFormValues(defaultValues);
    setFieldErrors({});
    setDraftNotice("Draft discarded");
  };

  const handleSubmit = async () => {
    setSubmissionError(null);

    if (hasFormFields) {
      const validationErrors = validateApplyRequiredFields(event.formFields, formValues);
      setFieldErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }

    setIsPending(true);
    try {
      const response = await fetch(`/api/events/${event.id}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: hasFormFields ? formValues : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setSubmissionError(payload.error || "Failed to submit application.");
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
                  {event.formFields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <label className="text-xs text-steel-gray">
                        {field.label}
                        {field.required ? <span className="ml-0.5 text-signal-orange">*</span> : null}
                      </label>
                      {field.type === "textarea" ? (
                        <Textarea
                          rows={4}
                          placeholder={field.placeholder ?? ""}
                          value={formValues[field.label] ?? ""}
                          onChange={(e) =>
                            setFormValues((prev) => ({ ...prev, [field.label]: e.target.value }))
                          }
                          className="border-[var(--ghost-border)] bg-[var(--ghost-white)] text-ice-white placeholder:text-steel-gray/60"
                        />
                      ) : field.type === "select" ? (
                        <Select
                          value={formValues[field.label] || undefined}
                          onValueChange={(value) =>
                            setFormValues((prev) => ({ ...prev, [field.label]: value }))
                          }
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
                            checked={formValues[field.label] === "true"}
                            onCheckedChange={(checked) =>
                              setFormValues((prev) => ({
                                ...prev,
                                [field.label]: checked === true ? "true" : "",
                              }))
                            }
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
                          value={formValues[field.label] ?? ""}
                          onChange={(e) =>
                            setFormValues((prev) => ({ ...prev, [field.label]: e.target.value }))
                          }
                          className="border-[var(--ghost-border)] bg-[var(--ghost-white)] text-ice-white placeholder:text-steel-gray/60"
                        />
                      )}
                      {fieldErrors[field.label] ? (
                        <p className="text-xs text-red-400">{fieldErrors[field.label]}</p>
                      ) : null}
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
                disabled={isPending}
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
