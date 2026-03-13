import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError, logInfo } from "@/lib/logger";
import { recordApiError, recordApiRequest, recordRegistrationCreated } from "@/lib/metrics";
import { ACTIVE_REGISTRATION_STATUSES, nextRegistrationStatus } from "@/lib/event-registration";
import { sendTemplatedEmail } from "@/lib/email";
import { migrateLegacySubmissionData, parseSubmissionData } from "@/lib/form-submission";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/events/[eventId]/registrations", "POST");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rawFormData = body.formData && typeof body.formData === "object" && !Array.isArray(body.formData)
      ? (body.formData as Record<string, unknown>)
      : null;

    const { eventId } = await params;
    const [event, form] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          slug: true,
          registrationMode: true,
          registrationReviewMode: true,
          capacity: true,
        },
      }),
      prisma.form.findUnique({
        where: { eventId },
        select: {
          id: true,
          status: true,
          fields: {
            select: { id: true, label: true, type: true, required: true, order: true },
            orderBy: { order: "asc" },
          },
        },
      }),
    ]);
    if (!event || event.registrationMode !== "internal") {
      return NextResponse.json({ error: "Event does not support internal registration" }, { status: 400 });
    }

    // If event has a form, require form data
    if (form && form.fields.length > 0) {
      if (!rawFormData) {
        return NextResponse.json({ error: "Registration form data is required" }, { status: 400 });
      }
      const structured = migrateLegacySubmissionData(rawFormData, form.fields);

      // Validate required fields
      const missingFields: string[] = [];
      for (const field of form.fields) {
        if (!field.required) continue;
        const answer = structured.answers[field.id];
        if (!answer) {
          missingFields.push(field.label);
          continue;
        }

        if (typeof answer.value === "string" && !answer.value.trim()) {
          missingFields.push(field.label);
          continue;
        }

        if (typeof answer.value === "object" && answer.value !== null) {
          if (!answer.value.url || !answer.value.filename) {
            missingFields.push(field.label);
          }
        }
      }
      if (missingFields.length > 0) {
        return NextResponse.json(
          { error: "Missing required fields", missingFields },
          { status: 400 }
        );
      }
    }

    const activeCount = await prisma.eventRegistration.count({
      where: {
        eventId,
        status: { in: ACTIVE_REGISTRATION_STATUSES },
      },
    });

    // Determine registration status based on review mode
    const isManualReview = event.registrationReviewMode === "manual";
    const status = isManualReview
      ? "registered" // pending admin review
      : nextRegistrationStatus(event.capacity, activeCount);
    const now = new Date();

    const existing = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id,
        },
      },
    });

    const registration = existing
      ? await prisma.eventRegistration.update({
          where: { id: existing.id },
          data: {
            status,
            note: null,
            waitlistedAt: status === "waitlisted" ? now : null,
            approvedAt: status === "approved" ? now : null,
            rejectedAt: null,
            cancelledAt: null,
          },
        })
      : await prisma.eventRegistration.create({
          data: {
            eventId,
            userId: session.user.id,
            status,
            waitlistedAt: status === "waitlisted" ? now : null,
          },
        });

    // Create linked FormSubmission if form exists and data was provided
    if (form && rawFormData) {
      const parsed = parseSubmissionData(rawFormData);
      const payloadData = parsed.schemaVersion >= 2
        ? {
            schemaVersion: 2,
            answers: parsed.answers,
            legacy: { unmapped: parsed.legacyUnmapped },
          }
        : migrateLegacySubmissionData(rawFormData, form.fields);

      const sanitizedData = JSON.parse(JSON.stringify(payloadData)) as Prisma.InputJsonObject;
      // Delete old submission for this registration if re-registering
      if (existing) {
        await prisma.formSubmission.deleteMany({
          where: { eventRegistrationId: registration.id },
        });
      }
      await prisma.formSubmission.create({
        data: {
          formId: form.id,
          eventRegistrationId: registration.id,
          schemaVersion: 2,
          data: sanitizedData,
          status: isManualReview ? "in_review" : "new",
        },
      });
    }

    recordRegistrationCreated(status);

    if (session.user.email) {
      const templateKey = isManualReview
        ? "registration-confirmed"
        : status === "waitlisted"
          ? "registration-waitlisted"
          : "registration-confirmed";
      const statusLabel = isManualReview
        ? "pending review"
        : status === "waitlisted"
          ? "waitlisted"
          : "confirmed";
      await sendTemplatedEmail({
        key: templateKey,
        to: session.user.email,
        variables: {
          name: session.user.name || session.user.email,
          eventTitle: event.title,
          status: statusLabel,
          note: "",
        },
        fallbackSubject:
          status === "waitlisted"
            ? "You are on the waitlist for {{eventTitle}}"
            : "Registration confirmed for {{eventTitle}}",
        fallbackBody:
          status === "waitlisted"
            ? "<p>Hello {{name}}, you are currently on the waitlist for <strong>{{eventTitle}}</strong>.</p>"
            : "<p>Hello {{name}}, your registration for <strong>{{eventTitle}}</strong> is confirmed.</p>",
      });
    }

    logInfo("event_registration_upserted", {
      pathname: "/api/events/[eventId]/registrations",
      method: "POST",
      status: 201,
      requestId,
      details: { eventId, userId: session.user.id, registrationStatus: status },
    });

    return NextResponse.json(registration, { status: existing ? 200 : 201 });
  } catch (error) {
    recordApiError("/api/events/[eventId]/registrations", "POST");
    logError("event_registration_failed", {
      pathname: "/api/events/[eventId]/registrations",
      method: "POST",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to register for event" }, { status: 500 });
  }
}
