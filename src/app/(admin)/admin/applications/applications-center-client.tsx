"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminFiltersBar } from "@/components/admin/admin-filters-bar";
import { ApplicationsPanel } from "@/components/admin/applications-panel";
import type {
  ApplicationsResponse,
  ApplicationRow,
  RegistrationStatus,
  ReviewSubmissionStatus,
} from "@/components/admin/events-admin-types";

const REGISTRATION_OPTIONS: Array<{ value: "all" | RegistrationStatus; label: string }> = [
  { value: "all", label: "All registration states" },
  { value: "registered", label: "Registered" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const REVIEW_OPTIONS: Array<{ value: "all" | ReviewSubmissionStatus; label: string }> = [
  { value: "all", label: "All review states" },
  { value: "new", label: "New" },
  { value: "in_review", label: "In Review" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

function clampPage(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

export function ApplicationsCenterClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialState = useMemo(() => {
    const q = searchParams.get("q") ?? "";
    const eventId = searchParams.get("eventId") ?? "all";
    const registrationStatus =
      (searchParams.get("registrationStatus") as "all" | RegistrationStatus | null) ?? "all";
    const reviewStatus =
      (searchParams.get("reviewStatus") as "all" | ReviewSubmissionStatus | null) ?? "all";
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo = searchParams.get("dateTo") ?? "";
    const pageSizeRaw = Number.parseInt(searchParams.get("pageSize") ?? "25", 10);
    const pageRaw = Number.parseInt(searchParams.get("page") ?? "1", 10);

    return {
      q,
      eventId,
      registrationStatus,
      reviewStatus,
      dateFrom,
      dateTo,
      page: clampPage(pageRaw),
      pageSize: [10, 25, 50, 100].includes(pageSizeRaw) ? pageSizeRaw : 25,
    };
  }, [searchParams]);

  const [q, setQ] = useState(initialState.q);
  const [eventId, setEventId] = useState(initialState.eventId);
  const [registrationStatus, setRegistrationStatus] = useState(initialState.registrationStatus);
  const [reviewStatus, setReviewStatus] = useState(initialState.reviewStatus);
  const [dateFrom, setDateFrom] = useState(initialState.dateFrom);
  const [dateTo, setDateTo] = useState(initialState.dateTo);
  const [page, setPage] = useState(initialState.page);
  const [pageSize, setPageSize] = useState(initialState.pageSize);

  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [events, setEvents] = useState<ApplicationsResponse["events"]>([]);
  const [total, setTotal] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (eventId !== "all") params.set("eventId", eventId);
    if (registrationStatus !== "all") params.set("registrationStatus", registrationStatus);
    if (reviewStatus !== "all") params.set("reviewStatus", reviewStatus);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 25) params.set("pageSize", String(pageSize));
    return params.toString();
  }, [dateFrom, dateTo, eventId, page, pageSize, q, registrationStatus, reviewStatus]);

  useEffect(() => {
    const current = searchParams.toString();
    if (current === queryString) return;
    const nextHref = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(nextHref, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/applications?${queryString}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Failed to load applications.");
        }

        const payload = (await response.json()) as ApplicationsResponse;
        setRows(payload.items);
        setEvents(payload.events);
        setTotal(payload.total);
        setTruncated(payload.truncated);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load applications.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [queryString]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  return (
    <div className="p-8 mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">Applications Center</h1>
          <p className="mt-1 text-sm text-steel-gray">
            Manage event applications in one place: status updates, payload review, and hard delete.
          </p>
        </div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ghost-border)] px-4 py-2 text-xs text-steel-gray transition-colors hover:bg-white/5 hover:text-ice-white"
        >
          Back to Events
        </Link>
      </div>

      <AdminFiltersBar
        search={q}
        onSearchChange={(value) => {
          setQ(value);
          setPage(1);
        }}
        searchPlaceholder="Search by event, member, email, or payload..."
      >
        <select
          value={eventId}
          onChange={(e) => {
            setEventId(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[var(--ghost-border)] bg-midnight-light px-3 py-2 text-xs text-ice-white"
        >
          <option value="all">All events</option>
          {events.map((event) => (
            <option key={event.eventId} value={event.eventId}>
              {event.eventTitle}
            </option>
          ))}
        </select>
        <select
          value={registrationStatus}
          onChange={(e) => {
            setRegistrationStatus(e.target.value as "all" | RegistrationStatus);
            setPage(1);
          }}
          className="rounded-lg border border-[var(--ghost-border)] bg-midnight-light px-3 py-2 text-xs text-ice-white"
        >
          {REGISTRATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={reviewStatus}
          onChange={(e) => {
            setReviewStatus(e.target.value as "all" | ReviewSubmissionStatus);
            setPage(1);
          }}
          className="rounded-lg border border-[var(--ghost-border)] bg-midnight-light px-3 py-2 text-xs text-ice-white"
        >
          {REVIEW_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[var(--ghost-border)] bg-midnight-light px-3 py-2 text-xs text-ice-white"
          aria-label="Date from"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[var(--ghost-border)] bg-midnight-light px-3 py-2 text-xs text-ice-white"
          aria-label="Date to"
        />
        <select
          value={pageSize}
          onChange={(e) => {
            const nextSize = Number.parseInt(e.target.value, 10);
            setPageSize(nextSize);
            setPage(1);
          }}
          className="rounded-lg border border-[var(--ghost-border)] bg-midnight-light px-3 py-2 text-xs text-ice-white"
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </AdminFiltersBar>

      {truncated ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <p>
            Results were clipped by scan guardrails. Narrow your filters for complete high-volume result sets.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="glass-card px-4 py-8 text-center text-sm text-steel-gray">Loading applications...</div>
      ) : (
        <ApplicationsPanel
          initialRows={rows}
          showEventColumn
          showFilters={false}
          onRowsChange={setRows}
          emptyMessage="No applications match the selected filters."
        />
      )}

      <div className="flex items-center justify-between rounded-xl border border-[var(--ghost-border)] bg-midnight-light px-4 py-3">
        <p className="text-xs text-steel-gray">
          Showing {rows.length} of {total} applications
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--ghost-border)] px-2.5 py-1.5 text-xs text-steel-gray transition-colors hover:bg-white/5 hover:text-ice-white disabled:opacity-50"
          >
            <ChevronLeft size={12} /> Prev
          </button>
          <span className="text-xs text-ice-white">
            Page {page} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
            disabled={page >= pageCount}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--ghost-border)] px-2.5 py-1.5 text-xs text-steel-gray transition-colors hover:bg-white/5 hover:text-ice-white disabled:opacity-50"
          >
            Next <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
