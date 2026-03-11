"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  ApplicantRow,
  EventHubTab,
  EventListRow,
  RegistrationStatus,
  ReviewQueueRow,
  ReviewSubmissionStatus,
} from "@/components/admin/events-admin-types";

const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  registered: "Registered",
  waitlisted: "Waitlisted",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const REGISTRATION_STATUS_OPTIONS: RegistrationStatus[] = [
  "registered",
  "waitlisted",
  "approved",
  "rejected",
  "cancelled",
];

const REVIEW_STATUS_LABELS: Record<ReviewSubmissionStatus, string> = {
  new: "New",
  in_review: "In Review",
  accepted: "Accepted",
  rejected: "Rejected",
};

const REVIEW_STATUS_OPTIONS: ReviewSubmissionStatus[] = [
  "new",
  "in_review",
  "accepted",
  "rejected",
];

function normalizeHubTab(value: string | null | undefined): EventHubTab {
  if (value === "applicants" || value === "review-queue" || value === "events") return value;
  return "events";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EventsHubClient({
  events,
  applicants,
  reviewQueue,
}: {
  events: EventListRow[];
  applicants: ApplicantRow[];
  reviewQueue: ReviewQueueRow[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<EventHubTab>(() =>
    normalizeHubTab(searchParams.get("tab"))
  );
  const [eventsSearch, setEventsSearch] = useState("");
  const [applicantQuery, setApplicantQuery] = useState("");
  const [applicantStatusFilter, setApplicantStatusFilter] = useState<RegistrationStatus | "all">("all");
  const [reviewQuery, setReviewQuery] = useState("");
  const [reviewStatusFilter, setReviewStatusFilter] = useState<ReviewSubmissionStatus | "all">("all");
  const [reviewItems, setReviewItems] = useState<ReviewQueueRow[]>(reviewQueue);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [updatingSubmissionId, setUpdatingSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeTab === "events") {
      params.delete("tab");
    } else {
      params.set("tab", activeTab);
    }

    const nextQuery = params.toString();
    if (nextQuery === searchParams.toString()) return;
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [activeTab, pathname, router, searchParams]);

  const filteredEvents = useMemo(() => {
    return events.filter((item) => item.title.toLowerCase().includes(eventsSearch.toLowerCase()));
  }, [events, eventsSearch]);

  const filteredApplicants = useMemo(() => {
    return applicants.filter((item) => {
      if (applicantStatusFilter !== "all" && item.status !== applicantStatusFilter) return false;
      const haystack = `${item.eventTitle} ${item.userName ?? ""} ${item.userEmail ?? ""}`.toLowerCase();
      return haystack.includes(applicantQuery.toLowerCase());
    });
  }, [applicantQuery, applicantStatusFilter, applicants]);

  const filteredReviewItems = useMemo(() => {
    return reviewItems.filter((item) => {
      if (reviewStatusFilter !== "all" && item.status !== reviewStatusFilter) return false;
      const dataText = Object.values(item.data).join(" ");
      const haystack = `${item.eventTitle} ${item.applicantName ?? ""} ${item.applicantEmail ?? ""} ${dataText}`.toLowerCase();
      return haystack.includes(reviewQuery.toLowerCase());
    });
  }, [reviewItems, reviewQuery, reviewStatusFilter]);

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setDeletingEventId(eventId);
    await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
    router.refresh();
    setDeletingEventId(null);
  };

  const handleReviewStatusUpdate = async (
    submissionId: string,
    status: ReviewSubmissionStatus
  ) => {
    setUpdatingSubmissionId(submissionId);
    const response = await fetch(`/api/admin/submissions/${submissionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      const payload = (await response.json()) as {
        id: string;
        status: ReviewSubmissionStatus;
        updatedAt?: string;
      };
      setReviewItems((prev) =>
        prev.map((item) =>
          item.id === submissionId
            ? {
                ...item,
                status: payload.status,
                updatedAt: typeof payload.updatedAt === "string" ? payload.updatedAt : item.updatedAt,
              }
            : item
        )
      );
    }

    setUpdatingSubmissionId(null);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">Events</h1>
          <p className="text-sm text-steel-gray mt-1">
            Manage event content, applicants, and review queue in one workspace.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-signal-orange text-white text-xs font-medium hover:bg-[var(--signal-orange-hover)] transition-colors"
        >
          <Plus size={14} /> Create New
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EventHubTab)}>
        <TabsList className="bg-[var(--ghost-white)] border border-[var(--ghost-border)]">
          <TabsTrigger
            value="events"
            className="data-[state=active]:bg-signal-orange data-[state=active]:text-white"
          >
            Events
          </TabsTrigger>
          <TabsTrigger
            value="applicants"
            className="data-[state=active]:bg-signal-orange data-[state=active]:text-white"
          >
            Applicants
          </TabsTrigger>
          <TabsTrigger
            value="review-queue"
            className="data-[state=active]:bg-signal-orange data-[state=active]:text-white"
          >
            Review Queue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4 space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-gray" />
            <input
              type="text"
              value={eventsSearch}
              onChange={(e) => setEventsSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-midnight-light border border-[var(--ghost-border)] text-sm text-ice-white placeholder:text-steel-gray focus:border-signal-orange/30 focus:outline-none transition-colors"
            />
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--ghost-border)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-steel-gray uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-steel-gray uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-steel-gray uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-steel-gray uppercase tracking-wider">
                    Applicants
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-steel-gray uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-steel-gray uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--ghost-border)] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-ice-white font-medium">{item.title}</p>
                        <p className="text-xs text-steel-gray">{item.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          item.status === "published"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-steel-gray">{item.type}</td>
                    <td className="px-4 py-3 text-xs text-steel-gray">{item.registrationsCount}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-steel-gray">{formatDate(item.date)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/events/${item.id}`}
                          className="p-1.5 rounded-md text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </Link>
                        <Link
                          href={`/admin/events/${item.id}?tab=applicants`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border border-[var(--ghost-border)] text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
                        >
                          <Users size={12} /> Open Applicants
                        </Link>
                        <Link
                          href={`/admin/events/${item.id}?tab=review-queue`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border border-[var(--ghost-border)] text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
                        >
                          <Ticket size={12} /> Open Review
                        </Link>
                        <Link
                          href={`/events/${item.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-md text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
                          title="View"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <button
                          onClick={() => handleDeleteEvent(item.id)}
                          disabled={deletingEventId === item.id}
                          className="p-1.5 rounded-md text-steel-gray hover:text-red-400 hover:bg-red-500/5 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-steel-gray">
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="applicants" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-gray" />
              <input
                type="text"
                value={applicantQuery}
                onChange={(e) => setApplicantQuery(e.target.value)}
                placeholder="Search by event, member name, or email..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-midnight-light border border-[var(--ghost-border)] text-sm text-ice-white"
              />
            </div>
            <select
              value={applicantStatusFilter}
              onChange={(e) => setApplicantStatusFilter(e.target.value as RegistrationStatus | "all")}
              className="px-3 py-2.5 rounded-lg bg-midnight-light border border-[var(--ghost-border)] text-xs text-ice-white"
            >
              <option value="all">All statuses</option>
              {REGISTRATION_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {REGISTRATION_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--ghost-border)] text-left text-xs text-steel-gray uppercase tracking-wider">
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplicants.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--ghost-border)] last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-sm text-ice-white">{item.eventTitle}</p>
                      <p className="text-xs text-steel-gray">{item.eventSlug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-ice-white">{item.userName || "Unnamed Member"}</p>
                      <p className="text-xs text-steel-gray">{item.userEmail || "No email"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-ice-white">
                      {REGISTRATION_STATUS_LABELS[item.status]}
                    </td>
                    <td className="px-4 py-3 text-xs text-steel-gray">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/events/${item.eventId}?tab=applicants`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border border-[var(--ghost-border)] text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
                      >
                        <Users size={12} /> Open Applicants
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredApplicants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-steel-gray">
                      No applicants found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="review-queue" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-gray" />
              <input
                type="text"
                value={reviewQuery}
                onChange={(e) => setReviewQuery(e.target.value)}
                placeholder="Search review queue..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-midnight-light border border-[var(--ghost-border)] text-sm text-ice-white"
              />
            </div>
            <select
              value={reviewStatusFilter}
              onChange={(e) => setReviewStatusFilter(e.target.value as ReviewSubmissionStatus | "all")}
              className="px-3 py-2.5 rounded-lg bg-midnight-light border border-[var(--ghost-border)] text-xs text-ice-white"
            >
              <option value="all">All statuses</option>
              {REVIEW_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {REVIEW_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--ghost-border)] text-left text-xs text-steel-gray uppercase tracking-wider">
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Submission</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registration</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviewItems.map((item) => {
                  const preview = Object.entries(item.data)
                    .slice(0, 2)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(" | ");

                  return (
                    <tr
                      key={item.id}
                      data-testid="review-row"
                      data-status={item.status}
                      className="border-b border-[var(--ghost-border)] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm text-ice-white">{item.eventTitle}</p>
                        <p className="text-xs text-steel-gray">{formatDate(item.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-ice-white">{item.applicantName || "Unknown user"}</p>
                        <p className="text-xs text-steel-gray">{item.applicantEmail || "No email"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-ice-white">{preview || "No fields submitted"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-ice-white">{REVIEW_STATUS_LABELS[item.status]}</td>
                      <td className="px-4 py-3 text-xs text-steel-gray">
                        {item.registrationStatus
                          ? REGISTRATION_STATUS_LABELS[item.registrationStatus]
                          : "No registration"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {REVIEW_STATUS_OPTIONS.map((status) => (
                            <button
                              key={status}
                              aria-label={`Set ${status}`}
                              onClick={() => handleReviewStatusUpdate(item.id, status)}
                              disabled={updatingSubmissionId === item.id || item.status === status}
                              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                                item.status === status
                                  ? "bg-signal-orange/10 border-signal-orange/30 text-signal-orange"
                                  : "border-[var(--ghost-border)] text-steel-gray hover:text-ice-white hover:bg-white/5"
                              }`}
                            >
                              {REVIEW_STATUS_LABELS[status]}
                            </button>
                          ))}
                          <Link
                            href={`/admin/events/${item.eventId}?tab=review-queue`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border border-[var(--ghost-border)] text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
                          >
                            <ExternalLink size={12} /> Open Event
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredReviewItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-steel-gray">
                      No review items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
