import { prisma } from "@/lib/prisma";
import { ContentListClient } from "@/components/admin/content-list";

export default async function AdminResourceCategoriesPage() {
  const categories = await prisma.resourceCategory.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <ContentListClient
      title="Resource Categories"
      description="Manage categories for the resource library."
      createHref="/admin/resource-categories/new"
      items={categories.map((c) => ({
        id: c.id,
        title: c.name,
        slug: c.slug,
        status: "published",
        type: c.description || "",
        date: new Date().toISOString(), // dummy date to satisfy ContentItem interface
        editHref: `/admin/resource-categories/${c.id}`,
      }))}
      contentType="resource-categories"
    />
  );
}
