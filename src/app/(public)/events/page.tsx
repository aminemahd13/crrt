import { prisma } from "@/lib/prisma";
import { getVisibleEventsWhere } from "@/lib/event-config";
import { EventsPage } from "./events-client";

export const dynamic = "force-dynamic";

export default async function EventsServerPage() {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: getVisibleEventsWhere(now),
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      startDate: true,
      endDate: true,
      location: true,
      coverImage: true,
      themePreset: true,
      themeAccent: true,
      registrationMode: true,
      registrationLabel: true,
      registrationUrl: true,
      tags: {
        select: {
          tag: {
            select: {
              name: true,
            },
          },
        },
      },
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
