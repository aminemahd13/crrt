import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PublicFormClient } from "./form-client";

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const form = await prisma.form.findFirst({
    where: { slug, status: "published" },
    include: {
      fields: { orderBy: { order: "asc" } },
    },
  });

  if (!form) return notFound();

  return (
    <PublicFormClient
      form={{
        id: form.id,
        title: form.title,
        fields: form.fields.map((f) => ({
          id: f.id,
          label: f.label,
          type: f.type,
          required: f.required,
          placeholder: f.placeholder,
          options: f.options,
        })),
      }}
    />
  );
}
