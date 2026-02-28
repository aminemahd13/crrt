import { prisma } from "@/lib/prisma";
import { ContentListClient } from "@/components/admin/content-list";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <ContentListClient
      title="Events"
      description="Manage trainings, conferences, competitions, and workshops."
      createHref="/admin/events/new"
      items={events.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        status: e.published ? "published" : "draft",
        type: e.type,
        date: e.startDate.toISOString(),
        editHref: `/admin/events/${e.id}`,
      }))}
      contentType="events"
    />
  );
}
