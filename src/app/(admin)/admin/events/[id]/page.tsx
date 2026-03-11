import { prisma } from "@/lib/prisma";
import { toStringRecord } from "@/lib/json";
import { notFound } from "next/navigation";
import { EditEventClient } from "./edit-client";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  const [event, form, registrations, orphanSubmissions] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
    }),
    prisma.form.findUnique({
      where: { eventId: id },
      include: { fields: { orderBy: { order: "asc" } } },
    }),
    prisma.eventRegistration.findMany({
      where: { eventId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
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
    }),
    prisma.formSubmission.findMany({
      where: {
        form: { eventId: id },
        eventRegistrationId: null,
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
    }),
  ]);

  if (!event) return notFound();

  const registrationFields = (form?.fields ?? []).map((field) => ({
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder ?? "",
    options:
      typeof field.options === "string"
        ? field.options
        : Array.isArray(field.options)
          ? (field.options as string[]).join(", ")
          : "",
    order: field.order,
  }));

  const registrationRows = registrations.map((registration) => {
    const submission = registration.formSubmission;
    const createdAt = submission?.createdAt ?? registration.createdAt;
    const updatedAt = submission?.updatedAt ?? registration.updatedAt;

    return {
      id: `reg:${registration.id}`,
      registrationId: registration.id,
      submissionId: submission?.id ?? null,
      eventId: event.id,
      eventTitle: event.title,
      eventSlug: event.slug,
      userId: registration.userId,
      userName: registration.user.name,
      userEmail: registration.user.email,
      registrationStatus: registration.status,
      reviewStatus: submission?.status
        ? (submission.status as "new" | "in_review" | "accepted" | "rejected")
        : null,
      note: registration.note,
      submissionData: toStringRecord(submission?.data),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  });

  const orphanRows = orphanSubmissions.flatMap((submission) => {
    const linkedEvent = submission.form.event;
    if (!linkedEvent) return [];

    return [
      {
        id: `sub:${submission.id}`,
        registrationId: null,
        submissionId: submission.id,
        eventId: linkedEvent.id,
        eventTitle: linkedEvent.title,
        eventSlug: linkedEvent.slug,
        userId: "",
        userName: null,
        userEmail: null,
        registrationStatus: null,
        reviewStatus: submission.status as "new" | "in_review" | "accepted" | "rejected",
        note: null,
        submissionData: toStringRecord(submission.data),
        createdAt: submission.createdAt.toISOString(),
        updatedAt: submission.updatedAt.toISOString(),
      },
    ];
  });

  return (
    <EditEventClient
      event={{
        ...event,
        startDate: event.startDate.toISOString().slice(0, 16),
        endDate: event.endDate?.toISOString().slice(0, 16) ?? "",
        publishStart: event.publishStart?.toISOString().slice(0, 16) ?? "",
        publishEnd: event.publishEnd?.toISOString().slice(0, 16) ?? "",
      }}
      initialRegistrationFields={registrationFields}
      initialApplications={[...registrationRows, ...orphanRows].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )}
      initialTab={tab}
    />
  );
}
