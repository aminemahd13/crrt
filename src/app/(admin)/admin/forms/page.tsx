import { prisma } from "@/lib/prisma";
import { FormListClient } from "./forms-list-client";

export default async function FormsPage() {
  const forms = await prisma.form.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { submissions: true } },
    },
  });

  return (
    <FormListClient
      forms={forms.map((f) => ({
        id: f.id,
        title: f.title,
        slug: f.slug,
        status: f.status,
        version: f.version,
        submissionCount: f._count.submissions,
        createdAt: f.createdAt.toISOString(),
      }))}
    />
  );
}
