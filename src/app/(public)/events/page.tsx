import { prisma } from "@/lib/prisma";
import { getVisibleEventsWhere } from "@/lib/event-config";
import { EventsPage } from "./events-client";

export default async function EventsServerPage() {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: getVisibleEventsWhere(now),
    orderBy: { startDate: "desc" },
    include: {
      tags: { include: { tag: true } },
    },
  });

  return (
    <EventsPage
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        description: e.description,
        type: e.type,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate?.toISOString() ?? null,
        location: e.location,
        coverImage: e.coverImage,
        themePreset: e.themePreset,
        themeAccent: e.themeAccent,
        registrationMode: e.registrationMode,
        registrationLabel: e.registrationLabel,
        registrationUrl: e.registrationUrl,
        tags: Array.from(new Set(e.tags.map((ct) => ct.tag.name))),
      }))}
    />
  );
}
