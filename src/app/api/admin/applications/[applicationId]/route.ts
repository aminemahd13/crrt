import { NextResponse } from "next/server";
import type { EventRegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decodeApplicationId, encodeRegistrationApplicationId, encodeSubmissionApplicationId } from "@/lib/application-id";
import {
  parseSubmissionData,
  toDisplayRecordFromSubmission,
  updateSubmissionFromDisplayPatch,
} from "@/lib/form-submission";

const REVIEW_STATUSES = new Set(["new", "in_review", "accepted", "rejected"] as const);
const REGISTRATION_STATUSES = new Set<EventRegistrationStatus>([
  "registered",
  "waitlisted",
  "approved",
  "rejected",
  "cancelled",
]);

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

async function resolveApplication(applicationId: string) {
  const decoded = decodeApplicationId(applicationId);
  if (!decoded) return null;

  if (decoded.type === "registration") {
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: decoded.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            organization: true,
            city: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
        formSubmission: {
          include: {
            form: {
              include: {
                fields: { orderBy: { order: "asc" } },
                sections: { orderBy: { order: "asc" } },
              },
            },
          },
        },
      },
    });

    if (!registration) return null;
    return {
      registration,
      submission: registration.formSubmission,
      event: registration.event,
      user: registration.user,
      form: registration.formSubmission?.form ?? null,
    };
  }

  const submission = await prisma.formSubmission.findUnique({
    where: { id: decoded.id },
    include: {
      form: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              startDate: true,
              endDate: true,
              location: true,
            },
          },
          fields: { orderBy: { order: "asc" } },
          sections: { orderBy: { order: "asc" } },
        },
      },
      eventRegistration: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              organization: true,
              city: true,
            },
          },
        },
      },
    },
  });

  if (!submission || !submission.form.event) return null;
  return {
    registration: submission.eventRegistration,
    submission,
    event: submission.form.event,
    user: submission.eventRegistration?.user ?? null,
    form: submission.form,
  };
}

async function buildDetailPayload(applicationId: string) {
  const resolved = await resolveApplication(applicationId);
  if (!resolved) return null;

  const displayData = toDisplayRecordFromSubmission(
    resolved.submission?.data,
    resolved.form?.fields ?? []
  );
  const structured = parseSubmissionData(resolved.submission?.data);

  const id = resolved.registration
    ? encodeRegistrationApplicationId(resolved.registration.id)
    : resolved.submission
      ? encodeSubmissionApplicationId(resolved.submission.id)
      : applicationId;

  return {
    id,
    registrationId: resolved.registration?.id ?? null,
    submissionId: resolved.submission?.id ?? null,
    event: {
      id: resolved.event.id,
      title: resolved.event.title,
      slug: resolved.event.slug,
      startDate: resolved.event.startDate.toISOString(),
      endDate: toIso(resolved.event.endDate),
      location: resolved.event.location,
    },
    applicant: {
      userId: resolved.user?.id ?? null,
      name: resolved.user?.name ?? null,
      email: resolved.user?.email ?? null,
      phone: resolved.user?.phone ?? null,
      organization: resolved.user?.organization ?? null,
      city: resolved.user?.city ?? null,
    },
    registration: {
      status: resolved.registration?.status ?? null,
      note: resolved.registration?.note ?? null,
      createdAt: toIso(resolved.registration?.createdAt),
      updatedAt: toIso(resolved.registration?.updatedAt),
      waitlistedAt: toIso(resolved.registration?.waitlistedAt),
      approvedAt: toIso(resolved.registration?.approvedAt),
      rejectedAt: toIso(resolved.registration?.rejectedAt),
      cancelledAt: toIso(resolved.registration?.cancelledAt),
    },
    review: {
      status: resolved.submission?.status ?? null,
      createdAt: toIso(resolved.submission?.createdAt),
      updatedAt: toIso(resolved.submission?.updatedAt),
    },
    formSections: (resolved.form?.sections ?? []).map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description ?? "",
      order: section.order,
      visibility: section.visibility,
    })),
    formFields: (resolved.form?.fields ?? []).map((field) => ({
      id: field.id,
      sectionId: field.sectionId ?? undefined,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder ?? "",
      options: Array.isArray(field.options) ? field.options.join(", ") : "",
      order: field.order,
      visibility: field.visibility,
      config: field.config ?? undefined,
    })),
    displayData,
    structuredSubmissionData:
      structured.schemaVersion >= 2
        ? {
            schemaVersion: structured.schemaVersion,
            answers: structured.answers,
            legacy: { unmapped: structured.legacyUnmapped },
          }
        : null,
    timeline: [
      { key: "registration-created", label: "Registration created", timestamp: toIso(resolved.registration?.createdAt) },
      { key: "submission-created", label: "Submission created", timestamp: toIso(resolved.submission?.createdAt) },
      { key: "registration-approved", label: "Approved", timestamp: toIso(resolved.registration?.approvedAt) },
      { key: "registration-rejected", label: "Rejected", timestamp: toIso(resolved.registration?.rejectedAt) },
      { key: "registration-waitlisted", label: "Waitlisted", timestamp: toIso(resolved.registration?.waitlistedAt) },
      { key: "registration-cancelled", label: "Cancelled", timestamp: toIso(resolved.registration?.cancelledAt) },
    ].filter((item) => Boolean(item.timestamp)),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { applicationId } = await params;
  const payload = await buildDetailPayload(applicationId);
  if (!payload) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  return NextResponse.json(payload);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { applicationId } = await params;
  const resolved = await resolveApplication(applicationId);
  if (!resolved) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    registrationStatus?: unknown;
    note?: unknown;
    reviewStatus?: unknown;
    data?: unknown;
  };

  const nextRegistrationStatus =
    typeof body.registrationStatus === "string" &&
    REGISTRATION_STATUSES.has(body.registrationStatus as EventRegistrationStatus)
      ? (body.registrationStatus as EventRegistrationStatus)
      : undefined;

  const nextReviewStatus =
    typeof body.reviewStatus === "string" &&
    REVIEW_STATUSES.has(body.reviewStatus as "new" | "in_review" | "accepted" | "rejected")
      ? (body.reviewStatus as "new" | "in_review" | "accepted" | "rejected")
      : undefined;

  if (nextRegistrationStatus && resolved.registration) {
    await prisma.eventRegistration.update({
      where: { id: resolved.registration.id },
      data: {
        status: nextRegistrationStatus,
        note: typeof body.note === "string" ? body.note.trim() : resolved.registration.note,
      },
    });
  } else if (typeof body.note === "string" && resolved.registration) {
    await prisma.eventRegistration.update({
      where: { id: resolved.registration.id },
      data: { note: body.note.trim() },
    });
  }

  if ((nextReviewStatus || body.data !== undefined) && resolved.submission) {
    let nextData = resolved.submission.data;
    if (body.data !== undefined) {
      if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
        return NextResponse.json({ error: "Payload data must be an object" }, { status: 400 });
      }
      try {
        nextData = updateSubmissionFromDisplayPatch(
          resolved.submission.data,
          resolved.form?.fields ?? [],
          body.data as Record<string, unknown>
        ) as unknown as object;
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Failed to update payload" },
          { status: 400 }
        );
      }
    }

    await prisma.formSubmission.update({
      where: { id: resolved.submission.id },
      data: {
        ...(nextReviewStatus ? { status: nextReviewStatus } : {}),
        ...(body.data !== undefined ? { data: nextData as never, schemaVersion: 2 } : {}),
      },
    });
  }

  const payload = await buildDetailPayload(applicationId);
  return NextResponse.json(payload);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { applicationId } = await params;
  const decoded = decodeApplicationId(applicationId);
  if (!decoded) {
    return NextResponse.json({ error: "Invalid application id" }, { status: 400 });
  }

  if (decoded.type === "registration") {
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: decoded.id },
      select: { id: true },
    });
    if (!registration) {
      return NextResponse.json({ ok: true });
    }
    await prisma.$transaction(async (tx) => {
      await tx.formSubmission.deleteMany({ where: { eventRegistrationId: registration.id } });
      await tx.eventRegistration.delete({ where: { id: registration.id } });
    });
    return NextResponse.json({ ok: true });
  }

  const submission = await prisma.formSubmission.findUnique({
    where: { id: decoded.id },
    select: { id: true, eventRegistrationId: true },
  });
  if (!submission) {
    return NextResponse.json({ ok: true });
  }
  await prisma.$transaction(async (tx) => {
    await tx.formSubmission.delete({ where: { id: submission.id } });
    if (submission.eventRegistrationId) {
      await tx.eventRegistration.deleteMany({ where: { id: submission.eventRegistrationId } });
    }
  });
  return NextResponse.json({ ok: true });
}
