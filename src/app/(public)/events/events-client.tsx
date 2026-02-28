"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar as CalendarIcon, MapPin, ArrowUpRight, Grid, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
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
  hackathon: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

export function EventsPage({ events }: { events: EventItem[] }) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "calendar">("grid");
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const now = new Date().toISOString();

  const filtered = events
    .filter((e) => (tab === "upcoming" ? e.startDate >= now : e.startDate < now))
    .filter((e) => !typeFilter || e.type === typeFilter);

  const types = ["training", "conference", "competition", "workshop", "hackathon"];

  // Calendar view helpers
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calMonth, calYear]);

  const eventsOnDay = (day: number) => {
    return events.filter((e) => {
      const d = new Date(e.startDate);
      return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === day;
    });
  };

  const monthLabel = new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

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

        <div className="flex flex-wrap gap-2 flex-1">
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

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--ghost-white)] border border-[var(--ghost-border)]">
          <button
            onClick={() => setView("grid")}
            className={`p-1.5 rounded-md transition-colors ${
              view === "grid" ? "bg-signal-orange/10 text-signal-orange" : "text-steel-gray hover:text-ice-white"
            }`}
          >
            <Grid size={14} />
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`p-1.5 rounded-md transition-colors ${
              view === "calendar" ? "bg-signal-orange/10 text-signal-orange" : "text-steel-gray hover:text-ice-white"
            }`}
          >
            <CalendarDays size={14} />
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {view === "calendar" ? (
        <div className="glass-card p-6">
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                else setCalMonth(calMonth - 1);
              }}
              className="p-2 rounded-lg hover:bg-white/5 text-steel-gray hover:text-ice-white"
            >
              <ChevronLeft size={16} />
            </button>
            <h3 className="font-heading font-semibold text-ice-white">{monthLabel}</h3>
            <button
              onClick={() => {
                if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                else setCalMonth(calMonth + 1);
              }}
              className="p-2 rounded-lg hover:bg-white/5 text-steel-gray hover:text-ice-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-[10px] text-steel-gray/60 font-medium uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dayEvents = eventsOnDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === calMonth && new Date().getFullYear() === calYear;

              return (
                <div
                  key={day}
                  className={`min-h-[80px] rounded-lg border p-1.5 ${
                    isToday ? "border-signal-orange/30 bg-signal-orange/5" : "border-[var(--ghost-border)] hover:bg-white/[0.02]"
                  }`}
                >
                  <span className={`text-xs ${isToday ? "text-signal-orange font-bold" : "text-steel-gray"}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <Link
                        key={ev.id}
                        href={`/events/${ev.slug}`}
                        className={`block text-[9px] px-1 py-0.5 rounded truncate border ${
                          typeColors[ev.type] || typeColors.workshop
                        }`}
                      >
                        {ev.title}
                      </Link>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-steel-gray">+{dayEvents.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Grid View */
        <>
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
                          <CalendarIcon size={12} /> {dateStr}
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
        </>
      )}
    </section>
  );
}
