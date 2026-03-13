"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ClipboardCheck, MapPin, Users } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LensCard } from "@/components/crrt/lens-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface EventPartner {
  id: string;
  name: string;
  logoUrl: string;
  website?: string | null;
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
    partners: EventPartner[];
    tags: string[];
  };
}

const isActiveRegistration = (status: RegistrationStatus | undefined) =>
  status === "registered" || status === "approved" || status === "waitlisted";

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
    defaultHref: `/events/${event.slug}/apply`,
  });
  const hasActiveRegistration = useMemo(
    () => isActiveRegistration(registration?.status),
    [registration]
  );

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

      const wasActive = isActiveRegistration(registration.status);
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

  return (
    <section className="mx-auto max-w-7xl px-6 py-12" style={theme.scopeStyle}>
      <Link
        href="/events"
        className="mb-8 inline-flex items-center gap-2 text-sm text-steel-gray transition-colors hover:text-ice-white"
      >
        <ArrowLeft size={16} /> Back to Events
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span
              style={theme.badgeStyle}
              className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider"
            >
              {event.type}
            </span>
            <h1 className="mb-4 text-3xl font-heading font-bold text-ice-white md:text-4xl">
              {event.title}
            </h1>
            <p className="text-lg leading-relaxed text-steel-gray">{event.description}</p>
          </motion.div>

          {event.content.trim().length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card p-6 md:p-8"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => (
                    <h2 className="mt-8 mb-3 flex items-center gap-3 font-heading text-2xl font-bold text-ice-white first:mt-0">
                      <span className="h-5 w-1 rounded-full bg-signal-orange" />
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-6 mb-2 font-heading text-xl font-semibold text-ice-white">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-relaxed text-steel-gray">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-4 list-disc space-y-1 pl-5 text-steel-gray">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-4 list-decimal space-y-1 pl-5 text-steel-gray">{children}</ol>
                  ),
                  li: ({ children }) => <li>{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="my-4 border-l-2 border-[var(--event-accent)] pl-4 italic text-steel-gray">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target={href?.startsWith("http") ? "_blank" : undefined}
                      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-[var(--event-accent)] underline decoration-transparent underline-offset-4 transition-colors hover:decoration-[var(--event-accent)]"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ children }) => (
                    <code className="rounded border border-[var(--ghost-border)] bg-midnight-light px-1.5 py-0.5 text-xs text-signal-orange">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="my-4 overflow-x-auto rounded-xl border border-[var(--ghost-border)] bg-midnight p-4 text-sm text-ice-white">
                      {children}
                    </pre>
                  ),
                  table: ({ children }) => (
                    <div className="my-4 overflow-x-auto">
                      <table className="w-full min-w-[520px] border-collapse border border-[var(--ghost-border)] text-left text-sm text-steel-gray">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-[var(--ghost-border)] bg-white/5 px-3 py-2 font-semibold text-ice-white">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-[var(--ghost-border)] px-3 py-2 align-top">
                      {children}
                    </td>
                  ),
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt ?? ""}
                      loading="lazy"
                      className="my-5 w-full rounded-xl border border-[var(--ghost-border)] bg-midnight-light object-cover"
                    />
                  ),
                }}
              >
                {event.content}
              </ReactMarkdown>
            </motion.div>
          )}

          {event.speakers.length > 0 && (
            <div>
              <h2 className="mb-6 flex items-center gap-3 font-heading text-xl font-bold text-ice-white">
                <div className="h-5 w-1 rounded-full bg-signal-orange" />
                Speakers
              </h2>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                {event.speakers.map((speaker, index) => (
                  <motion.div
                    key={speaker.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
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

          {event.partners.length > 0 && (
            <div className="glass-card border border-[var(--ghost-border)] p-6 md:p-7">
              <h2 className="mb-5 flex items-center gap-3 font-heading text-xl font-bold text-ice-white">
                <div className="h-5 w-1 rounded-full bg-signal-orange" />
                Event Partners
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {event.partners.map((partner) => {
                  const card = (
                    <div className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-[var(--ghost-border)] bg-midnight-light/70 px-3 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-[var(--event-accent)]/40 hover:bg-midnight-light">
                      <img
                        src={partner.logoUrl}
                        alt={`${partner.name} logo`}
                        loading="lazy"
                        className="h-10 w-auto max-w-[120px] object-contain"
                      />
                      <span className="text-xs font-semibold text-ice-white/90 group-hover:text-ice-white">
                        {partner.name}
                      </span>
                    </div>
                  );

                  if (partner.website) {
                    return (
                      <a
                        key={partner.id}
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={partner.name}
                      >
                        {card}
                      </a>
                    );
                  }

                  return <div key={partner.id}>{card}</div>;
                })}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="glass-card space-y-4 p-6">
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
                      {event.capacity} spots - {activeRegistrationCount} active
                    </p>
                  </div>
                )}
              </div>

              {event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {Array.from(new Set(event.tags)).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="border-[var(--ghost-border)] bg-[var(--ghost-white)] text-[10px] text-steel-gray"
                    >
                      {tag}
                    </Badge>
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
                  className="block w-full rounded-xl py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  {registrationConfig.label}
                </a>
              ) : hasActiveRegistration && registration ? (
                <div className="space-y-2">
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
                    <p className="flex items-center justify-center gap-1 text-center text-xs text-steel-gray">
                      <ClipboardCheck size={12} /> Your application is pending review
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
                </div>
              ) : (
                <Link
                  href={`/events/${event.slug}/apply`}
                  style={theme.buttonStyle}
                  className="block w-full rounded-xl py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  {registrationConfig.label}
                </Link>
              )}

              {registrationError && (
                <Alert variant="destructive" className="border-red-500/20 bg-red-500/10">
                  <AlertDescription className="text-xs text-red-400">
                    {registrationError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
