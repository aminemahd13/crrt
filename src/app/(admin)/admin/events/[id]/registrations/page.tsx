import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EventRegistrationsClient } from "./registrations-client";

export default async function AdminEventRegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      capacity: true,
    },
  });
  if (!event) return notFound();

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <EventRegistrationsClient
      event={event}
      registrations={registrations.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }))}
    />
  );
}
