import { prisma } from "@/lib/prisma";
import { ContentListClient } from "@/components/admin/content-list";

export default async function AdminResourcesPage() {
  const resources = await prisma.resource.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true }
  });

  return (
    <ContentListClient
      title="Resources"
      description="Manage the Resource Library links, documents, and videos."
      createHref="/admin/resources/new"
      items={resources.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.category.name, // using slug space to show category name in list
        status: r.isPublic ? "published" : "draft",
        type: r.type,
        date: r.createdAt.toISOString(),
        editHref: `/admin/resources/${r.id}`,
        viewHref: r.url,
      }))}
      contentType="resources"
    />
  );
}
