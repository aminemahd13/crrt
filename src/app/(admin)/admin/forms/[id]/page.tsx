import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { FormBuilderClient } from "@/components/admin/form-builder";
import { toSelectOptions } from "@/lib/json";

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const form = await prisma.form.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { order: "asc" } },
    },
  });

  if (!form) return notFound();

  return (
    <FormBuilderClient
      formId={form.id}
      initialTitle={form.title}
      initialSlug={form.slug}
      initialStatus={form.status}
      initialFields={form.fields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        required: f.required,
        placeholder: f.placeholder ?? "",
        options: toSelectOptions(f.options).join(", "),
        order: f.order,
      }))}
    />
  );
}
