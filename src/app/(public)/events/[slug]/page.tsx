import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EventDetail } from "./event-detail";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const now = new Date();

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      speakers: { orderBy: { order: "asc" } },
      tags: { include: { tag: true } },
    },
  });

  if (!event) return notFound();

  const isVisible =
    event.published &&
    (!event.publishStart || event.publishStart <= now) &&
    (!event.publishEnd || event.publishEnd >= now);
  if (!isVisible) return notFound();

  return (
    <EventDetail
      event={{
        ...event,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString() ?? null,
        themePreset: event.themePreset,
        themeAccent: event.themeAccent,
        registrationMode: event.registrationMode,
        registrationLabel: event.registrationLabel,
        registrationUrl: event.registrationUrl,
        speakers: event.speakers.map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          bio: s.bio,
          image: s.image,
        })),
        tags: Array.from(new Set(event.tags.map((ct) => ct.tag.name))),
      }}
    />
  );
}
