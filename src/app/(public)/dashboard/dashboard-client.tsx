"use client";

import { motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  LogOut,
  CheckCircle,
  Clock,
  XCircle,
  Ticket,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  image: string;
  joinedAt: string;
}

interface SubmissionItem {
  id: string;
  formTitle: string;
  status: string;
  date: string;
}

interface DashboardClientProps {
  user: UserProfile;
  submissions: SubmissionItem[];
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
  submissions,
  registrations,
  privateResources,
}: DashboardClientProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted": return <CheckCircle size={14} className="text-emerald-500" />;
      case "rejected": return <XCircle size={14} className="text-red-500" />;
      default: return <Clock size={14} className="text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "rejected": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

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
    <section className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <motion.div
        className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between glass-card p-8 group overflow-hidden relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-signal-orange/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-signal-orange/10 transition-colors duration-700" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-full bg-midnight border border-[var(--ghost-border)] flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.image ? (
              <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-steel-gray" />
            )}
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-ice-white">
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

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--ghost-border)] text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-heading font-bold text-ice-white flex items-center gap-2">
            Event Registrations
          </h2>
          <div className="glass-card p-6">
            {registrations.length === 0 ? (
              <div className="text-center py-10">
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
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-midnight-light border border-[var(--ghost-border)]"
                  >
                    <div>
                      <Link
                        href={`/events/${registration.eventSlug}`}
                        className="text-ice-white font-medium text-sm hover:text-signal-orange transition-colors"
                      >
                        {registration.eventTitle}
                      </Link>
                      <p className="text-xs text-steel-gray mt-1">
                        {new Date(registration.eventDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {registration.eventLocation ? ` • ${registration.eventLocation}` : ""}
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

          <h2 className="text-xl font-heading font-bold text-ice-white flex items-center gap-2">
            Recent Applications & Submissions
          </h2>

          <div className="glass-card p-6">
            {submissions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-steel-gray text-sm">You haven&apos;t submitted any applications yet.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {submissions.map((sub, i) => (
                  <motion.li
                    key={sub.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-midnight-light border border-[var(--ghost-border)]"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    <div>
                      <p className="text-ice-white font-medium text-sm mb-1">{sub.formTitle}</p>
                      <p className="text-xs text-steel-gray">
                        Submitted on {new Date(sub.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium capitalize shrink-0 ${getStatusBadge(sub.status)}`}>
                      {getStatusIcon(sub.status)}
                      {sub.status.replace("_", " ")}
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-heading font-bold text-ice-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-signal-orange" />
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
                    {resource.category} • {resource.type}
                  </p>
                </a>
              ))
            )}
          </div>

          <h2 className="text-xl font-heading font-bold text-ice-white">Quick Links</h2>
          <div className="glass-card p-4 space-y-2">
            <Link href="/resources" className="block px-4 py-3 rounded-lg text-sm text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors">
              Browse Resource Library
            </Link>
            <Link href="/events" className="block px-4 py-3 rounded-lg text-sm text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors">
              Upcoming Events
            </Link>
            <Link href="/projects" className="block px-4 py-3 rounded-lg text-sm text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors">
              Explore Our Projects
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
