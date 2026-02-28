import { prisma } from "@/lib/prisma";
import { EventsPage } from "./events-client";

export default async function EventsServerPage() {
  const events = await prisma.event.findMany({
    where: { published: true },
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
        tags: Array.from(new Set(e.tags.map((ct) => ct.tag.name))),
      }))}
    />
  );
}
