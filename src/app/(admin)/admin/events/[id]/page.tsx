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
  const [event, form, registrations, submissions] = await Promise.all([
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
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.formSubmission.findMany({
      where: {
        form: { eventId: id },
      },
      include: {
        eventRegistration: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!event) return notFound();

  const registrationFields = (form?.fields ?? []).map((f) => ({
    id: f.id,
    label: f.label,
    type: f.type,
    required: f.required,
    placeholder: f.placeholder ?? "",
    options: typeof f.options === "string" ? f.options : Array.isArray(f.options) ? (f.options as string[]).join(", ") : "",
    order: f.order,
  }));

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
      initialRegistrations={registrations.map((r) => ({
        id: r.id,
        eventId: r.eventId,
        eventTitle: event.title,
        eventSlug: event.slug,
        userId: r.userId,
        userName: r.user.name,
        userEmail: r.user.email,
        status: r.status,
        note: r.note,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))}
      initialReviewQueue={submissions.map((submission) => ({
        id: submission.id,
        eventId: event.id,
        eventTitle: event.title,
        eventSlug: event.slug,
        status: submission.status as "new" | "in_review" | "accepted" | "rejected",
        createdAt: submission.createdAt.toISOString(),
        updatedAt: submission.updatedAt.toISOString(),
        data: toStringRecord(submission.data),
        registrationId: submission.eventRegistrationId ?? null,
        registrationStatus: submission.eventRegistration?.status ?? null,
        applicantName: submission.eventRegistration?.user.name ?? null,
        applicantEmail: submission.eventRegistration?.user.email ?? null,
      }))}
      initialTab={tab}
    />
  );
}
