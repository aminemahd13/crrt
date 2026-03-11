import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MyEventsClient } from "./my-events-client";

export default async function MyEventsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/events");
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: { userId: session.user.id },
    include: {
      event: {
        select: {
          title: true,
          slug: true,
          startDate: true,
          endDate: true,
          location: true,
          type: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <MyEventsClient
      registrations={registrations.map((r) => ({
        id: r.id,
        status: r.status as "registered" | "waitlisted" | "approved" | "rejected" | "cancelled",
        createdAt: r.createdAt.toISOString(),
        eventTitle: r.event.title,
        eventSlug: r.event.slug,
        eventDate: r.event.startDate.toISOString(),
        eventEndDate: r.event.endDate?.toISOString() ?? null,
        eventLocation: r.event.location,
        eventType: r.event.type,
      }))}
    />
  );
}
