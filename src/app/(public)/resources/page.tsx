import { prisma } from "@/lib/prisma";
import { ResourcesPage } from "./resources-client";

export default async function ResourcesServerPage() {
  const categories = await prisma.resourceCategory.findMany({
    include: {
      resources: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <ResourcesPage
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        color: c.color,
        icon: c.icon,
        resources: c.resources.map((r) => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          description: r.description,
          url: r.url,
          type: r.type,
          createdAt: r.createdAt.toISOString(),
        })),
      }))}
    />
  );
}
