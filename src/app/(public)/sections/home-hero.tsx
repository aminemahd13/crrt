"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { NextEventPanel } from "@/components/crrt/next-event-panel";
import { CircuitTrace } from "@/components/crrt/circuit-trace";

interface HomeHeroProps {
  missionText: string;
  tagline: string;
  nextEvent: {
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

export function HomeHero({ missionText, tagline, nextEvent }: HomeHeroProps) {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Blueprint grid background */}
      <div className="absolute inset-0 blueprint-grid" />

      {/* Circuit trace decoration */}
      <CircuitTrace />

      {/* Gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-signal-orange/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Mission */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal-orange/10 border border-signal-orange/20 text-signal-orange text-xs font-medium tracking-wider mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-orange animate-pulse" />
                ENSA Agadir
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-ice-white leading-[1.1] tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-signal-orange">CRRT</span>
              <br />
              <span className="text-steel-gray text-3xl md:text-4xl lg:text-5xl font-medium">
                {missionText}
              </span>
            </motion.h1>

            <motion.p
              className="text-steel-gray text-lg max-w-md font-heading italic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              &ldquo;{tagline}&rdquo;
            </motion.p>

            <motion.div
              className="flex items-center gap-4 pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-signal-orange text-white font-medium text-sm hover:bg-[var(--signal-orange-hover)] transition-colors"
              >
                Explore Events
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--ghost-border)] text-ice-white font-medium text-sm hover:bg-white/5 transition-colors"
              >
                View Projects
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              className="flex items-center gap-8 pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {[
                { value: "2008", label: "Founded" },
                { value: "50+", label: "Members" },
                { value: "20+", label: "Projects" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-heading font-bold text-signal-orange">{stat.value}</div>
                  <div className="text-xs text-steel-gray uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Next Event Panel */}
          <div className="lg:pl-8">
            <NextEventPanel event={nextEvent} />
          </div>
        </div>
      </div>
    </section>
  );
}
