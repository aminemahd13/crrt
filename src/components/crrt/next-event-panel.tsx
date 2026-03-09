"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { getEventRegistrationConfig, getEventThemeStyles } from "@/lib/event-config";

interface NextEventPanelProps {
  event: {
    title: string;
    slug: string;
    startDate: string;
    endDate?: string | null;
    location?: string | null;
    type: string;
    description: string;
    themePreset?: string | null;
    themeAccent?: string | null;
    registrationMode?: string | null;
    registrationLabel?: string | null;
    registrationUrl?: string | null;
  } | null;
}

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl md:text-3xl font-heading font-bold text-signal-orange tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-steel-gray mt-1">{label}</span>
    </div>
  );
}

export function NextEventPanel({ event }: NextEventPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const countdown = useCountdown(event?.startDate ?? new Date().toISOString());

  if (!event) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-steel-gray text-sm">No upcoming events</p>
      </div>
    );
  }

  const dateStr = new Date(event.startDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const theme = getEventThemeStyles(event.themePreset, event.themeAccent);
  const registration = getEventRegistrationConfig({
    ...event,
    defaultHref: `/events/${event.slug}`,
  });

  return (
    <motion.div
      ref={ref}
      className="glass-card p-6 md:p-8 space-y-5 relative overflow-hidden"
      style={theme.scopeStyle}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Glow accent */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none"
        style={theme.glowStyle}
      />

      {/* Type badge */}
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium uppercase tracking-wider"
        style={theme.badgeStyle}
      >
        <Clock size={12} />
        Next {event.type}
      </div>

      {/* Title */}
      <h3 className="font-heading font-bold text-xl text-ice-white leading-tight">
        {event.title}
      </h3>

      {/* Meta */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-steel-gray">
          <Calendar size={14} style={theme.iconStyle} />
          {dateStr}
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-steel-gray">
            <MapPin size={14} style={theme.iconStyle} />
            {event.location}
          </div>
        )}
      </div>

      {/* Countdown */}
      <div className="flex items-center justify-between px-2 py-3 rounded-xl bg-midnight/50 border border-[var(--ghost-border)]">
        <CountdownUnit value={countdown.days} label="Days" />
        <span className="text-steel-gray/40 text-lg">:</span>
        <CountdownUnit value={countdown.hours} label="Hrs" />
        <span className="text-steel-gray/40 text-lg">:</span>
        <CountdownUnit value={countdown.minutes} label="Min" />
        <span className="text-steel-gray/40 text-lg">:</span>
        <CountdownUnit value={countdown.seconds} label="Sec" />
      </div>

      {/* CTA */}
      {registration.disabled || !registration.href ? (
        <button
          type="button"
          disabled
          style={theme.buttonSubtleStyle}
          className="inline-flex items-center gap-2 w-full justify-center px-5 py-2.5 rounded-xl border font-medium text-sm opacity-80 cursor-not-allowed"
        >
          {registration.label}
        </button>
      ) : registration.external ? (
        <a
          href={registration.href}
          target="_blank"
          rel="noopener noreferrer"
          style={theme.buttonStyle}
          className="inline-flex items-center gap-2 w-full justify-center px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:opacity-90 transition-opacity group"
        >
          {registration.label}
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </a>
      ) : (
        <Link
          href={registration.href}
          style={theme.buttonStyle}
          className="inline-flex items-center gap-2 w-full justify-center px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:opacity-90 transition-opacity group"
        >
          {registration.label}
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </motion.div>
  );
}
