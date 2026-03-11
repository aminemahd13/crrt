"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LensCard } from "@/components/crrt/lens-card";
import { BlueprintTimeline } from "@/components/crrt/blueprint-timeline";
import { LabGallery } from "@/components/crrt/lab-gallery";
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
    activeRegistrationCount: number;
    isAuthenticated: boolean;
    userRegistration: UserRegistrationSummary | null;
    speakers: Speaker[];
    tags: string[];
  };
}

export function EventDetail({ event }: EventDetailProps) {
  const [registration, setRegistration] = useState<UserRegistrationSummary | null>(event.userRegistration);
  const [activeRegistrationCount, setActiveRegistrationCount] = useState(event.activeRegistrationCount);
  const [isPending, setIsPending] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

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

  const handleRegister = async () => {
    setRegistrationError(null);
    setIsPending(true);
    try {
      const response = await fetch(`/api/events/${event.id}/registrations`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        setRegistrationError(payload.error || "Failed to register.");
        return;
      }

      const previousStatus = registration?.status ?? null;
      setRegistration({ id: payload.id as string, status: payload.status as RegistrationStatus });

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
                <button
                  type="button"
                  disabled
                  style={theme.buttonSubtleStyle}
                  className="w-full py-3 rounded-xl border font-medium text-sm opacity-80 cursor-not-allowed"
                >
                  {registrationConfig.label}
                </button>
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
                      <button
                        type="button"
                        disabled
                        style={theme.buttonSubtleStyle}
                        className="w-full py-3 rounded-xl border font-medium text-sm"
                      >
                        {registrationStatusLabel(registration.status)}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isPending}
                        className="w-full py-2.5 rounded-xl border border-[var(--ghost-border)] text-steel-gray text-sm hover:text-ice-white hover:bg-white/5 disabled:opacity-50"
                      >
                        {isPending ? "Updating..." : "Cancel Registration"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRegister}
                      disabled={isPending}
                      style={theme.buttonStyle}
                      className="w-full py-3 rounded-xl text-white font-medium text-sm text-center hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {isPending ? "Registering..." : registrationConfig.label}
                    </button>
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
