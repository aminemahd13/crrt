"use client";

import { motion } from "framer-motion";
import { Ticket, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";

interface RegistrationItem {
  id: string;
  status: "registered" | "waitlisted" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string;
  eventEndDate: string | null;
  eventLocation: string | null;
  eventType: string;
}

export function MyEventsClient({ registrations }: { registrations: RegistrationItem[] }) {
  const statusBadge = (status: RegistrationItem["status"]) => {
    switch (status) {
      case "approved":
      case "registered":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "waitlisted":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "cancelled":
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/20";
    }
  };

  const upcoming = registrations.filter(
    (r) => new Date(r.eventDate) >= new Date() && r.status !== "cancelled" && r.status !== "rejected"
  );
  const past = registrations.filter(
    (r) => new Date(r.eventDate) < new Date() || r.status === "cancelled" || r.status === "rejected"
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-heading font-bold text-ice-white">My Events</h1>

      {registrations.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CalendarDays size={32} className="mx-auto text-steel-gray/30 mb-3" />
          <p className="text-steel-gray text-sm">You haven&apos;t registered for any events yet.</p>
          <Link href="/events" className="inline-flex mt-4 px-4 py-2 rounded-lg bg-signal-orange text-white text-sm font-medium hover:opacity-90 transition-opacity">
            Browse Events
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-steel-gray uppercase tracking-wider">Upcoming</h2>
              {upcoming.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <Link
                      href={`/events/${r.eventSlug}`}
                      className="text-ice-white font-medium hover:text-signal-orange transition-colors"
                    >
                      {r.eventTitle}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-steel-gray">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={12} />
                        {new Date(r.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {r.eventLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {r.eventLocation}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-[var(--ghost-white)] border border-[var(--ghost-border)] uppercase tracking-wider text-[10px]">
                        {r.eventType}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs capitalize shrink-0 ${statusBadge(r.status)}`}>
                    <Ticket size={12} />
                    {r.status}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-steel-gray uppercase tracking-wider">Past & Inactive</h2>
              {past.map((r) => (
                <div
                  key={r.id}
                  className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-70"
                >
                  <div>
                    <Link
                      href={`/events/${r.eventSlug}`}
                      className="text-ice-white text-sm hover:text-signal-orange transition-colors"
                    >
                      {r.eventTitle}
                    </Link>
                    <p className="text-xs text-steel-gray mt-0.5">
                      {new Date(r.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs capitalize shrink-0 ${statusBadge(r.status)}`}>
                    <Ticket size={12} />
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
