"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, MapPin, ArrowUpRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  coverImage: string | null;
  tags: string[];
}

const typeColors: Record<string, string> = {
  training: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  conference: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  competition: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  workshop: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export function EventsPage({ events }: { events: EventItem[] }) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const now = new Date().toISOString();

  const filtered = events
    .filter((e) => (tab === "upcoming" ? e.startDate >= now : e.startDate < now))
    .filter((e) => !typeFilter || e.type === typeFilter);

  const types = ["training", "conference", "competition", "workshop"];

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div
        className="mb-10 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-4xl font-heading font-bold text-ice-white">Events</h1>
        <p className="text-steel-gray max-w-lg">
          Trainings, conferences, workshops, and competitions. Our program schedule for building the future.
        </p>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "upcoming" | "past")}>
          <TabsList className="bg-[var(--ghost-white)] border border-[var(--ghost-border)]">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-signal-orange data-[state=active]:text-white">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past" className="data-[state=active]:bg-signal-orange data-[state=active]:text-white">
              Past
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter(null)}
            className={`track-chip ${!typeFilter ? "active" : ""}`}
          >
            All
          </button>
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type === typeFilter ? null : type)}
              className={`track-chip ${typeFilter === type ? "active" : ""}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-steel-gray text-sm">No events found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((event, i) => {
            const dateStr = new Date(event.startDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });

            return (
              <motion.div
                key={event.id}
                className="glass-card overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Date badge */}
                <div className="relative p-6 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                        typeColors[event.type] || typeColors.workshop
                      }`}
                    >
                      {event.type}
                    </span>
                    <span className="text-xs text-steel-gray flex items-center gap-1">
                      <Calendar size={12} /> {dateStr}
                    </span>
                  </div>

                  <Link href={`/events/${event.slug}`}>
                    <h3 className="font-heading font-semibold text-lg text-ice-white group-hover:text-signal-orange transition-colors leading-snug">
                      {event.title}
                    </h3>
                  </Link>

                  <p className="text-sm text-steel-gray line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>

                  {event.location && (
                    <div className="flex items-center gap-1.5 text-xs text-steel-gray">
                      <MapPin size={12} className="text-signal-orange" />
                      {event.location}
                    </div>
                  )}

                  <Link
                    href={`/events/${event.slug}`}
                    className="inline-flex items-center gap-1 text-xs text-signal-orange hover:underline pt-1"
                  >
                    View details <ArrowUpRight size={12} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
