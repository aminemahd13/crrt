import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditEventClient } from "./edit-client";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { form: { include: { fields: { orderBy: { order: "asc" } } } } },
  });
  if (!event) return notFound();

  const registrationFields = (event.form?.fields ?? []).map((f) => ({
    id: f.id,
    label: f.label,
    type: f.type,
    required: f.required,
    placeholder: f.placeholder ?? "",
    options: typeof f.options === "string" ? f.options : Array.isArray(f.options) ? (f.options as string[]).join(", ") : "",
    order: f.order,
  }));

  return (
    <EditEventClient
      event={{
        ...event,
        startDate: event.startDate.toISOString().slice(0, 16),
        endDate: event.endDate?.toISOString().slice(0, 16) ?? "",
        publishStart: event.publishStart?.toISOString().slice(0, 16) ?? "",
        publishEnd: event.publishEnd?.toISOString().slice(0, 16) ?? "",
      }}
      initialRegistrationFields={registrationFields}
    />
  );
}
