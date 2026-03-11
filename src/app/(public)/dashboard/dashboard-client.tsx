"use client";

import { motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  Ticket,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  image: string;
  joinedAt: string;
}

interface DashboardClientProps {
  user: UserProfile;
  registrations: RegistrationItem[];
  privateResources: PrivateResourceItem[];
}

interface RegistrationItem {
  id: string;
  status: "registered" | "waitlisted" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string;
  eventLocation: string | null;
}

interface PrivateResourceItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string;
  type: string;
  category: string;
}

export function DashboardClient({
  user,
  registrations,
  privateResources,
}: DashboardClientProps) {
  const registrationBadge = (status: RegistrationItem["status"]) => {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="glass-card p-8 group overflow-hidden relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-signal-orange/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-signal-orange/10 transition-colors duration-700" />

        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-midnight border border-[var(--ghost-border)] flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={28} className="text-steel-gray" />
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-heading font-bold text-ice-white">
              Welcome back, {user.name || "Member"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-steel-gray">
              <span className="flex items-center gap-1.5">
                <Mail size={14} className="text-signal-orange" />
                {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-signal-orange" />
                Joined {new Date(user.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-signal-orange/10 text-signal-orange border border-signal-orange/20 text-xs font-semibold uppercase tracking-wider">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-bold text-ice-white">Recent Applications</h2>
            <Link href="/dashboard/applications" className="text-xs text-signal-orange hover:underline">
              View all
            </Link>
          </div>
          <div className="glass-card p-5">
            {registrations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-steel-gray text-sm">No event registrations yet.</p>
                <Link href="/events" className="inline-flex mt-3 text-xs text-signal-orange hover:underline">
                  Browse events
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {registrations.map((registration) => (
                  <li
                    key={registration.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-midnight-light border border-[var(--ghost-border)]"
                  >
                    <div>
                      <Link
                        href={`/events/${registration.eventSlug}`}
                        className="text-ice-white font-medium text-sm hover:text-signal-orange transition-colors"
                      >
                        {registration.eventTitle}
                      </Link>
                      <p className="text-xs text-steel-gray mt-0.5">
                        {new Date(registration.eventDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {registration.eventLocation ? ` · ${registration.eventLocation}` : ""}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs capitalize ${registrationBadge(registration.status)}`}
                    >
                      <Ticket size={12} />
                      {registration.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <h2 className="text-lg font-heading font-bold text-ice-white flex items-center gap-2">
            <ShieldCheck size={16} className="text-signal-orange" />
            Private Resources
          </h2>
          <div className="glass-card p-4 space-y-2">
            {privateResources.length === 0 ? (
              <p className="text-sm text-steel-gray px-2 py-3">No private resources published yet.</p>
            ) : (
              privateResources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-3 rounded-lg border border-[var(--ghost-border)] hover:bg-white/5 transition-colors"
                >
                  <p className="text-sm text-ice-white flex items-center justify-between">
                    {resource.title}
                    <ExternalLink size={12} className="text-steel-gray" />
                  </p>
                  <p className="text-[11px] text-steel-gray mt-1">
                    {resource.category} · {resource.type}
                  </p>
                </a>
              ))
            )}
          </div>

          <h2 className="text-lg font-heading font-bold text-ice-white">Quick Links</h2>
          <div className="glass-card p-4 space-y-1">
            <Link href="/resources" className="block px-4 py-2.5 rounded-lg text-sm text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors">
              Resource Library
            </Link>
            <Link href="/events" className="block px-4 py-2.5 rounded-lg text-sm text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors">
              Upcoming Events
            </Link>
            <Link href="/projects" className="block px-4 py-2.5 rounded-lg text-sm text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors">
              Explore Projects
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
