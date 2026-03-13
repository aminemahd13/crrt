"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminFiltersBar } from "@/components/admin/admin-filters-bar";
import { ApplicationsPanel } from "@/components/admin/applications-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function ApplicationsCenterClient({
  mode = "all",
}: {
  mode?: "all" | "review_queue";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reviewQueueMode = mode === "review_queue";

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
    if (reviewQueueMode) params.set("mode", "review_queue");
    if (q.trim()) params.set("q", q.trim());
    if (eventId !== "all") params.set("eventId", eventId);
    if (registrationStatus !== "all") params.set("registrationStatus", registrationStatus);
    if (reviewStatus !== "all") params.set("reviewStatus", reviewStatus);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 25) params.set("pageSize", String(pageSize));
    return params.toString();
  }, [dateFrom, dateTo, eventId, page, pageSize, q, registrationStatus, reviewQueueMode, reviewStatus]);
  const returnTo = useMemo(
    () => (queryString ? `${pathname}?${queryString}` : pathname),
    [pathname, queryString]
  );

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
      <PageHeader
        title={reviewQueueMode ? "Review Queue" : "Applications Center"}
        description={
          reviewQueueMode
            ? "Oldest-first queue focused on pending review submissions."
            : "Scan applications quickly, then open detail pages for all review actions."
        }
        actions={
          <>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-[var(--ghost-border)] bg-transparent text-steel-gray hover:bg-white/5 hover:text-ice-white"
            >
              <Link href="/admin/events">Back to Events</Link>
            </Button>
            {reviewQueueMode ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-[var(--ghost-border)] bg-transparent text-steel-gray hover:bg-white/5 hover:text-ice-white"
              >
                <Link href="/admin/applications">All Applications</Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-[var(--ghost-border)] bg-transparent text-steel-gray hover:bg-white/5 hover:text-ice-white"
              >
                <Link href="/admin/review-queue">Review Queue</Link>
              </Button>
            )}
          </>
        }
      />

      <AdminFiltersBar
        search={q}
        onSearchChange={(value) => {
          setQ(value);
          setPage(1);
        }}
        searchPlaceholder="Search by event, member, email, or payload..."
        advancedLabel="More filters"
        advancedChildren={
          <>
            <Select
              value={registrationStatus}
              onValueChange={(value) => {
                setRegistrationStatus(value as "all" | RegistrationStatus);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] border-[var(--ghost-border)] bg-midnight-light text-ice-white">
                <SelectValue placeholder="All registration states" />
              </SelectTrigger>
              <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
                {REGISTRATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-[156px] border-[var(--ghost-border)] bg-midnight-light text-ice-white"
              aria-label="Date from"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-[156px] border-[var(--ghost-border)] bg-midnight-light text-ice-white"
              aria-label="Date to"
            />
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                const nextSize = Number.parseInt(value, 10);
                setPageSize(nextSize);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[120px] border-[var(--ghost-border)] bg-midnight-light text-ice-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      >
        <Select
          value={eventId}
          onValueChange={(value) => {
            setEventId(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px] border-[var(--ghost-border)] bg-midnight-light text-ice-white">
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
            <SelectItem value="all">All events</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.eventId} value={event.eventId}>
                {event.eventTitle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={reviewStatus}
          onValueChange={(value) => {
            setReviewStatus(value as "all" | ReviewSubmissionStatus);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[170px] border-[var(--ghost-border)] bg-midnight-light text-ice-white">
            <SelectValue placeholder={reviewQueueMode ? "Queue status" : "All review states"} />
          </SelectTrigger>
          <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
            {REVIEW_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          rows={rows}
          showEventColumn
          emptyMessage="No applications match the selected filters."
          getRowHref={(row) =>
            `/admin/applications/${row.id}?returnTo=${encodeURIComponent(returnTo)}`
          }
        />
      )}

      <div className="flex items-center justify-between rounded-xl border border-[var(--ghost-border)] bg-midnight-light px-4 py-3">
        <p className="text-xs text-steel-gray">
          Showing {rows.length} of {total} applications
        </p>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            variant="outline"
            size="sm"
            className="border-[var(--ghost-border)] bg-transparent text-steel-gray hover:bg-white/5 hover:text-ice-white"
          >
            <ChevronLeft size={12} /> Prev
          </Button>
          <span className="text-xs text-ice-white">
            Page {page} / {pageCount}
          </span>
          <Button
            onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
            disabled={page >= pageCount}
            variant="outline"
            size="sm"
            className="border-[var(--ghost-border)] bg-transparent text-steel-gray hover:bg-white/5 hover:text-ice-white"
          >
            Next <ChevronRight size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}
