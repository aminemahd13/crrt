import { prisma } from "@/lib/prisma";
import { toStringRecord } from "@/lib/json";
import { EventsHubClient } from "./events-hub-client";

export default async function AdminEventsPage() {
  const [events, registrations, submissions] = await Promise.all([
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    }),
    prisma.eventRegistration.findMany({
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
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.formSubmission.findMany({
      where: {
        form: {
          eventId: { not: null },
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

  return (
    <EventsHubClient
      events={events.map((event) => ({
        id: event.id,
        title: event.title,
        slug: event.slug,
        status: event.published ? "published" : "draft",
        type: event.type,
        date: event.startDate.toISOString(),
        registrationsCount: event._count.registrations,
      }))}
      applicants={registrations.map((registration) => ({
        id: registration.id,
        eventId: registration.eventId,
        eventTitle: registration.event.title,
        eventSlug: registration.event.slug,
        userId: registration.userId,
        userName: registration.user.name,
        userEmail: registration.user.email,
        status: registration.status,
        note: registration.note,
        createdAt: registration.createdAt.toISOString(),
        updatedAt: registration.updatedAt.toISOString(),
      }))}
      reviewQueue={submissions.flatMap((submission) => {
        const event = submission.form.event;
        if (!event) return [];
        return [
          {
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
          },
        ];
      })}
    />
  );
}
