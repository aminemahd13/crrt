import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditEventClient } from "./edit-client";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return notFound();

  return (
    <EditEventClient
      event={{
        ...event,
        startDate: event.startDate.toISOString().slice(0, 16),
        endDate: event.endDate?.toISOString().slice(0, 16) ?? "",
      }}
    />
  );
}
