import { prisma } from "@/lib/prisma";
import { EventsHubClient } from "./events-hub-client";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  });

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
        capacity: event.capacity,
      }))}
    />
  );
}
