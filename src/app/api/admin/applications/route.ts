import { NextResponse } from "next/server";
import type { EventRegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toStringRecord } from "@/lib/json";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest } from "@/lib/metrics";

const REGISTRATION_STATUSES = new Set<EventRegistrationStatus>([
  "registered",
  "waitlisted",
  "approved",
  "rejected",
  "cancelled",
]);

const REVIEW_STATUSES = new Set(["new", "in_review", "accepted", "rejected"] as const);
const MAX_PAGE_SIZE = 100;
const MAX_SCAN = 2000;

function clampNumber(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function parseStartOfDay(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseEndOfDay(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeQuery(value: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function includesQuery(haystack: string, query: string): boolean {
  if (!query) return true;
  return haystack.toLowerCase().includes(query);
}

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/applications", "GET");

  try {
    const url = new URL(request.url);
    const q = normalizeQuery(url.searchParams.get("q"));
    const eventId = (url.searchParams.get("eventId") ?? "").trim() || null;
    const page = clampNumber(url.searchParams.get("page"), 1, 1, Number.MAX_SAFE_INTEGER);
    const pageSize = clampNumber(url.searchParams.get("pageSize"), 25, 1, MAX_PAGE_SIZE);
    const dateFrom = parseStartOfDay(url.searchParams.get("dateFrom"));
    const dateTo = parseEndOfDay(url.searchParams.get("dateTo"));

    const registrationStatusRaw = (url.searchParams.get("registrationStatus") ?? "").trim();
    const registrationStatus = REGISTRATION_STATUSES.has(registrationStatusRaw as EventRegistrationStatus)
      ? (registrationStatusRaw as EventRegistrationStatus)
      : null;

    const reviewStatusRaw = (url.searchParams.get("reviewStatus") ?? "").trim();
    const reviewStatus = REVIEW_STATUSES.has(reviewStatusRaw as "new" | "in_review" | "accepted" | "rejected")
      ? (reviewStatusRaw as "new" | "in_review" | "accepted" | "rejected")
      : null;

    const createdAtFilter = dateFrom || dateTo
      ? {
          ...(dateFrom ? { gte: dateFrom } : {}),
          ...(dateTo ? { lte: dateTo } : {}),
        }
      : undefined;

    const registrations = await prisma.eventRegistration.findMany({
      where: {
        ...(eventId ? { eventId } : {}),
        ...(registrationStatus ? { status: registrationStatus } : {}),
        ...(reviewStatus ? { formSubmission: { is: { status: reviewStatus } } } : {}),
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        formSubmission: {
          select: {
            id: true,
            status: true,
            data: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: MAX_SCAN,
    });

    const orphanSubmissions = registrationStatus
      ? []
      : await prisma.formSubmission.findMany({
          where: {
            eventRegistrationId: null,
            ...(reviewStatus ? { status: reviewStatus } : {}),
            ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
            form: {
              ...(eventId ? { eventId } : { eventId: { not: null } }),
            },
          },
          include: {
            form: {
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: MAX_SCAN,
        });

    const registrationRows = registrations.map((registration) => {
      const submission = registration.formSubmission;
      const createdAt = submission?.createdAt ?? registration.createdAt;
      const updatedAt = submission?.updatedAt ?? registration.updatedAt;

      return {
        id: `reg:${registration.id}`,
        registrationId: registration.id,
        submissionId: submission?.id ?? null,
        eventId: registration.eventId,
        eventTitle: registration.event.title,
        eventSlug: registration.event.slug,
        userId: registration.userId,
        userName: registration.user.name,
        userEmail: registration.user.email,
        registrationStatus: registration.status,
        reviewStatus: submission?.status ?? null,
        note: registration.note,
        submissionData: toStringRecord(submission?.data),
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      };
    });

    const orphanRows = orphanSubmissions.flatMap((submission) => {
      const event = submission.form.event;
      if (!event) return [];

      return [
        {
          id: `sub:${submission.id}`,
          registrationId: null,
          submissionId: submission.id,
          eventId: event.id,
          eventTitle: event.title,
          eventSlug: event.slug,
          userId: "",
          userName: null,
          userEmail: null,
          registrationStatus: null,
          reviewStatus: submission.status,
          note: null,
          submissionData: toStringRecord(submission.data),
          createdAt: submission.createdAt.toISOString(),
          updatedAt: submission.updatedAt.toISOString(),
        },
      ];
    });

    const rows = [...registrationRows, ...orphanRows]
      .filter((row) => {
        if (!q) return true;
        const text = `${row.eventTitle} ${row.eventSlug} ${row.userName ?? ""} ${row.userEmail ?? ""} ${Object.values(row.submissionData).join(" ")}`;
        return includesQuery(text, q);
      })
      .sort((a, b) => {
        const bTime = new Date(b.createdAt).getTime();
        const aTime = new Date(a.createdAt).getTime();
        return bTime - aTime;
      });

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const items = rows.slice(start, start + pageSize);
    const events = await prisma.event.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    const truncated = registrations.length >= MAX_SCAN || orphanSubmissions.length >= MAX_SCAN;

    logInfo("admin_applications_loaded", {
      pathname: "/api/admin/applications",
      method: "GET",
      status: 200,
      requestId,
      details: {
        count: items.length,
        total,
        page,
        pageSize,
        eventId,
        truncated,
      },
    });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      events: events.map((event) => ({
        eventId: event.id,
        eventTitle: event.title,
        eventSlug: event.slug,
      })),
      truncated,
    });
  } catch (error) {
    recordApiError("/api/admin/applications", "GET");
    logError("admin_applications_load_failed", {
      pathname: "/api/admin/applications",
      method: "GET",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  }
}
