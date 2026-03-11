"use client";

import Link from "next/link";
import { CalendarDays, ClipboardCheck, MapPin, Ticket } from "lucide-react";

interface MemberApplicationItem {
  id: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string;
  eventLocation: string | null;
  eventType: string;
  registrationStatus: "registered" | "waitlisted" | "approved" | "rejected" | "cancelled";
  reviewStatus: "new" | "in_review" | "accepted" | "rejected" | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  submissionData: Record<string, string>;
}

const REGISTRATION_STATUS_LABELS: Record<MemberApplicationItem["registrationStatus"], string> = {
  registered: "Registered",
  waitlisted: "Waitlisted",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const REVIEW_STATUS_LABELS: Record<NonNullable<MemberApplicationItem["reviewStatus"]>, string> = {
  new: "New",
  in_review: "In Review",
  accepted: "Accepted",
  rejected: "Rejected",
};

function registrationBadge(status: MemberApplicationItem["registrationStatus"]): string {
  switch (status) {
    case "registered":
    case "approved":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "waitlisted":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "rejected":
      return "border-red-500/20 bg-red-500/10 text-red-300";
    case "cancelled":
    default:
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
  }
}

function reviewBadge(status: MemberApplicationItem["reviewStatus"]): string {
  switch (status) {
    case "accepted":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "rejected":
      return "border-red-500/20 bg-red-500/10 text-red-300";
    case "in_review":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "new":
      return "border-blue-500/20 bg-blue-500/10 text-blue-300";
    default:
      return "border-[var(--ghost-border)] bg-midnight text-steel-gray";
  }
}

export function ApplicationsClient({ applications }: { applications: MemberApplicationItem[] }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-ice-white">My Applications</h1>
        <p className="mt-1 text-sm text-steel-gray">
          Track registration and review status across all your event applications.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ClipboardCheck size={30} className="mx-auto mb-3 text-steel-gray/40" />
          <p className="text-sm text-steel-gray">No applications yet.</p>
          <Link
            href="/events"
            className="mt-4 inline-flex rounded-lg bg-signal-orange px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((item) => {
            const payloadPreview = Object.entries(item.submissionData).slice(0, 4);
            return (
              <article
                key={item.id}
                className="glass-card space-y-4 border border-[var(--ghost-border)] p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <Link
                      href={`/events/${item.eventSlug}`}
                      className="text-base font-medium text-ice-white transition-colors hover:text-signal-orange"
                    >
                      {item.eventTitle}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-steel-gray">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} />
                        {new Date(item.eventDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {item.eventLocation ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} />
                          {item.eventLocation}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-[var(--ghost-border)] px-2 py-0.5 uppercase tracking-wider">
                        {item.eventType}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${registrationBadge(item.registrationStatus)}`}
                    >
                      <Ticket size={12} />
                      {REGISTRATION_STATUS_LABELS[item.registrationStatus]}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${reviewBadge(item.reviewStatus)}`}
                    >
                      <ClipboardCheck size={12} />
                      {item.reviewStatus ? REVIEW_STATUS_LABELS[item.reviewStatus] : "No submission"}
                    </span>
                  </div>
                </div>

                {item.note ? (
                  <p className="rounded-lg border border-[var(--ghost-border)] bg-midnight-light px-3 py-2 text-xs text-steel-gray">
                    Admin note: {item.note}
                  </p>
                ) : null}

                {payloadPreview.length > 0 ? (
                  <div className="rounded-lg border border-[var(--ghost-border)] bg-midnight-light p-3">
                    <p className="mb-2 text-[11px] uppercase tracking-wider text-steel-gray">
                      Submission snapshot
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {payloadPreview.map(([key, value]) => (
                        <div key={key}>
                          <p className="text-[10px] uppercase tracking-wider text-steel-gray">{key}</p>
                          <p className="text-xs text-ice-white">{value || "-"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
