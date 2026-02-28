import { prisma } from "@/lib/prisma";
import { ContentListClient } from "@/components/admin/content-list";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <ContentListClient
      title="Projects"
      description="Manage robotics projects and research initiatives."
      createHref="/admin/projects/new"
      items={projects.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.published ? "published" : "draft",
        type: p.status,
        date: p.createdAt.toISOString(),
        editHref: `/admin/projects/${p.id}`,
      }))}
      contentType="projects"
    />
  );
}
