"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ArrowLeft, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { LensCard } from "@/components/crrt/lens-card";
import { BlueprintTimeline } from "@/components/crrt/blueprint-timeline";
import { LabGallery } from "@/components/crrt/lab-gallery";
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
import { getEventRegistrationConfig, getEventThemeStyles } from "@/lib/event-config";
import { registrationStatusLabel } from "@/lib/event-registration";

type RegistrationStatus = "registered" | "waitlisted" | "approved" | "rejected" | "cancelled";

interface UserRegistrationSummary {
  id: string;
  status: RegistrationStatus;
}

interface Speaker {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  image: string | null;
}

interface FormFieldDef {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string | null;
  options: unknown;
}

interface EventDetailProps {
  event: {
    id: string;
    title: string;
    slug: string;
    description: string;
    content: string;
    type: string;
    startDate: string;
    endDate: string | null;
    location: string | null;
    capacity: number | null;
    themePreset?: string | null;
    themeAccent?: string | null;
    registrationMode?: string | null;
    registrationLabel?: string | null;
    registrationUrl?: string | null;
    registrationReviewMode?: string | null;
    activeRegistrationCount: number;
    isAuthenticated: boolean;
    userRegistration: UserRegistrationSummary | null;
    speakers: Speaker[];
    tags: string[];
    formFields: FormFieldDef[];
    userProfile: { name?: string; email?: string; phone?: string; organization?: string; city?: string } | null;
  };
}

function getProfilePrefill(label: string, profile: EventDetailProps["event"]["userProfile"]): string {
  if (!profile) return "";
  const key = label.toLowerCase();
  if (key.includes("name") && !key.includes("last")) return profile.name ?? "";
  if (key.includes("email") || key.includes("e-mail")) return profile.email ?? "";
  if (key.includes("phone") || key.includes("tel")) return profile.phone ?? "";
  if (key.includes("organi") || key.includes("school") || key.includes("university") || key.includes("institution"))
    return profile.organization ?? "";
  if (key.includes("city") || key.includes("ville")) return profile.city ?? "";
  return "";
}

export function EventDetail({ event }: EventDetailProps) {
  const [registration, setRegistration] = useState<UserRegistrationSummary | null>(event.userRegistration);
  const [activeRegistrationCount, setActiveRegistrationCount] = useState(event.activeRegistrationCount);
  const [isPending, setIsPending] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of event.formFields) {
      initial[field.label] = getProfilePrefill(field.label, event.userProfile);
    }
    return initial;
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
  const theme = getEventThemeStyles(event.themePreset, event.themeAccent);

  const registrationConfig = getEventRegistrationConfig({
    ...event,
    defaultHref: "/dashboard",
  });
  const isInternalRegistration = registrationConfig.mode === "internal";
  const hasActiveRegistration =
    registration &&
    registration.status !== "cancelled" &&
    registration.status !== "rejected";
  const hasFormFields = event.formFields.length > 0;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    for (const field of event.formFields) {
      if (field.required && (!formValues[field.label] || !formValues[field.label].trim())) {
        errors[field.label] = `${field.label} is required`;
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    setRegistrationError(null);

    // If there are form fields and form is not shown yet, show it
    if (hasFormFields && !showForm) {
      setShowForm(true);
      return;
    }

    // Validate form if fields exist
    if (hasFormFields && !validateForm()) {
      return;
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
        setRegistrationError(payload.error || "Failed to register.");
        return;
      }

      const previousStatus = registration?.status ?? null;
      setRegistration({ id: payload.id as string, status: payload.status as RegistrationStatus });
      setShowForm(false);

      const wasActive = previousStatus === "registered" || previousStatus === "approved";
      const nowActive = payload.status === "registered" || payload.status === "approved";
      if (!wasActive && nowActive) {
        setActiveRegistrationCount((prev) => prev + 1);
      }
    } catch {
      setRegistrationError("Failed to register.");
    } finally {
      setIsPending(false);
    }
  };

  const handleCancel = async () => {
    if (!registration) return;

    setRegistrationError(null);
    setIsPending(true);
    try {
      const response = await fetch(`/api/events/registrations/${registration.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        setRegistrationError(payload.error || "Failed to cancel registration.");
        return;
      }

      const wasActive = registration.status === "registered" || registration.status === "approved";
      setRegistration({ id: payload.id as string, status: payload.status as RegistrationStatus });
      if (wasActive) {
        setActiveRegistrationCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      setRegistrationError("Failed to cancel registration.");
    } finally {
      setIsPending(false);
    }
  };

  const getFieldOptions = (field: FormFieldDef): string[] => {
    if (Array.isArray(field.options)) return field.options.map(String);
    if (typeof field.options === "string") return field.options.split(",").map((o: string) => o.trim()).filter(Boolean);
    return [];
  };

  // Parse content sections for timeline
  const sections = event.content
    .split(/^## /m)
    .filter(Boolean)
    .map((s, i) => {
      const lines = s.trim().split("\n");
      return { id: `agenda-${i}`, year: i + 1, title: lines[0], description: lines.slice(1).join("\n").trim() };
    });

  return (
    <section className="max-w-7xl mx-auto px-6 py-12" style={theme.scopeStyle}>
      {/* Back */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm text-steel-gray hover:text-ice-white transition-colors mb-8"
      >
        <ArrowLeft size={16} /> Back to Events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main */}
        <div className="lg:col-span-2 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span
              style={theme.badgeStyle}
              className="inline-flex items-center text-xs font-medium px-3 py-1 rounded-full border uppercase tracking-wider mb-4"
            >
              {event.type}
            </span>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-ice-white mb-4">
              {event.title}
            </h1>
            <p className="text-steel-gray text-lg leading-relaxed">
              {event.description}
            </p>
          </motion.div>

          {/* Agenda Timeline */}
          {sections.length > 0 && (
            <div>
              <h2 className="flex items-center gap-3 font-heading font-bold text-xl text-ice-white mb-6">
                <div className="w-1 h-5 rounded-full bg-signal-orange" />
                Agenda
              </h2>
              <BlueprintTimeline
                milestones={sections.map((s) => ({
                  id: s.id,
                  year: s.year,
                  title: s.title,
                  description: s.description,
                }))}
              />
            </div>
          )}

          {/* Speakers */}
          {event.speakers.length > 0 && (
            <div>
              <h2 className="flex items-center gap-3 font-heading font-bold text-xl text-ice-white mb-6">
                <div className="w-1 h-5 rounded-full bg-signal-orange" />
                Speakers
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {event.speakers.map((speaker, index) => (
                  <motion.div
                    key={speaker.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                     <LensCard
                       name={speaker.name}
                       role={speaker.role || "Speaker"}
                       image={speaker.image || "/images/placeholder.svg"}
                     />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {(() => {
            const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
            const images: { src: string; alt: string; caption?: string }[] = [];
            let match;
            while ((match = imgRegex.exec(event.content)) !== null) {
              images.push({ src: match[2], alt: match[1] || event.title, caption: match[1] || undefined });
            }
            if (images.length === 0) return null;
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="flex items-center gap-3 font-heading font-bold text-xl text-ice-white mb-6">
                  <div className="w-1 h-5 rounded-full bg-signal-orange" />
                  Gallery
                </h2>
                <LabGallery images={images} />
              </motion.div>
            );
          })()}
        </div>

        {/* Sticky Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-heading font-semibold text-ice-white">Event Details</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="mt-0.5" style={theme.iconStyle} />
                  <div>
                    <p className="text-sm text-ice-white">{dateStr}</p>
                    <p className="text-xs text-steel-gray">{timeStr}</p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="mt-0.5" style={theme.iconStyle} />
                    <p className="text-sm text-ice-white">{event.location}</p>
                  </div>
                )}

                {event.capacity && (
                  <div className="flex items-start gap-3">
                    <Users size={16} className="mt-0.5" style={theme.iconStyle} />
                    <p className="text-sm text-ice-white">
                      {event.capacity} spots • {activeRegistrationCount} confirmed
                    </p>
                  </div>
                )}
              </div>

              {event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {Array.from(new Set(event.tags)).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--ghost-white)] border border-[var(--ghost-border)] text-steel-gray"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {registrationConfig.disabled || !registrationConfig.href ? (
                <Button
                  type="button"
                  disabled
                  style={theme.buttonSubtleStyle}
                  className="h-auto w-full cursor-not-allowed rounded-xl border py-3 text-sm font-medium opacity-80"
                >
                  {registrationConfig.label}
                </Button>
              ) : registrationConfig.external ? (
                <a
                  href={registrationConfig.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={theme.buttonStyle}
                  className="block w-full py-3 rounded-xl text-white font-medium text-sm text-center hover:opacity-90 transition-opacity"
                >
                  {registrationConfig.label}
                </a>
              ) : isInternalRegistration ? (
                <div className="space-y-2">
                  {!event.isAuthenticated ? (
                    <div className="space-y-2">
                      <Link
                        href={`/signup?callbackUrl=${encodeURIComponent(`/events/${event.slug}`)}`}
                        style={theme.buttonStyle}
                        className="block w-full py-3 rounded-xl text-white font-medium text-sm text-center hover:opacity-90 transition-opacity"
                      >
                        Create Account to Register
                      </Link>
                      <Link
                        href={`/login?callbackUrl=${encodeURIComponent(`/events/${event.slug}`)}`}
                        style={theme.buttonSubtleStyle}
                        className="block w-full py-2.5 rounded-xl border font-medium text-sm text-center"
                      >
                        Already a member? Sign In
                      </Link>
                    </div>
                  ) : hasActiveRegistration ? (
                    <>
                      <Button
                        type="button"
                        disabled
                        variant="outline"
                        style={theme.buttonSubtleStyle}
                        className="h-auto w-full rounded-xl border py-3 text-sm font-medium"
                      >
                        {registrationStatusLabel(registration.status)}
                      </Button>
                      {event.registrationReviewMode === "manual" && registration.status === "registered" && (
                        <p className="text-xs text-steel-gray text-center flex items-center justify-center gap-1">
                          <ClipboardCheck size={12} /> Your registration is pending review
                        </p>
                      )}
                      <Button
                        type="button"
                        onClick={handleCancel}
                        disabled={isPending}
                        variant="outline"
                        className="h-auto w-full rounded-xl border-[var(--ghost-border)] py-2.5 text-sm text-steel-gray hover:bg-white/5 hover:text-ice-white"
                      >
                        {isPending ? "Updating..." : "Cancel Registration"}
                      </Button>
                    </>
                  ) : showForm && hasFormFields ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="space-y-3"
                    >
                      <h4 className="text-sm font-medium text-ice-white">Registration Form</h4>
                      {event.formFields.map((field) => (
                        <div key={field.id} className="space-y-1">
                          <label className="text-xs text-steel-gray">
                            {field.label}
                            {field.required && <span className="text-signal-orange ml-0.5">*</span>}
                          </label>
                          {field.type === "textarea" ? (
                            <Textarea
                              rows={3}
                              placeholder={field.placeholder ?? ""}
                              value={formValues[field.label] ?? ""}
                              onChange={(e) =>
                                setFormValues((prev) => ({ ...prev, [field.label]: e.target.value }))
                              }
                              className="border-[var(--ghost-border)] bg-[var(--ghost-white)] text-ice-white placeholder:text-steel-gray/50"
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
                                {getFieldOptions(field).map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
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
                              {field.placeholder}
                            </label>
                          ) : (
                            <Input
                              type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
                              placeholder={field.placeholder ?? ""}
                              value={formValues[field.label] ?? ""}
                              onChange={(e) =>
                                setFormValues((prev) => ({ ...prev, [field.label]: e.target.value }))
                              }
                              className="border-[var(--ghost-border)] bg-[var(--ghost-white)] text-ice-white placeholder:text-steel-gray/50"
                            />
                          )}
                          {fieldErrors[field.label] && (
                            <p className="text-xs text-red-400">{fieldErrors[field.label]}</p>
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          onClick={() => { setShowForm(false); setFieldErrors({}); }}
                          variant="outline"
                          className="h-auto flex-1 rounded-xl border-[var(--ghost-border)] py-2.5 text-sm text-steel-gray hover:bg-white/5 hover:text-ice-white"
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={handleRegister}
                          disabled={isPending}
                          style={theme.buttonStyle}
                          className="h-auto flex-1 rounded-xl py-2.5 text-sm font-medium text-white hover:opacity-90"
                        >
                          {isPending ? "Submitting..." : "Submit"}
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleRegister}
                      disabled={isPending}
                      style={theme.buttonStyle}
                      className="h-auto w-full rounded-xl py-3 text-center text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {isPending ? "Registering..." : registrationConfig.label}
                    </Button>
                  )}
                  {registrationError && <p className="text-xs text-red-400">{registrationError}</p>}
                </div>
              ) : (
                <Link
                  href={registrationConfig.href}
                  style={theme.buttonStyle}
                  className="block w-full py-3 rounded-xl text-white font-medium text-sm text-center hover:opacity-90 transition-opacity"
                >
                  {registrationConfig.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
