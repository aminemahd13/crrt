import { prisma } from "@/lib/prisma";
import { ProjectsPage } from "./projects-client";

export default async function ProjectsServerPage() {
  const projects = await prisma.project.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });

  return (
    <ProjectsPage
      projects={projects.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        status: p.status,
        stackTags: JSON.parse(p.stackTags) as string[],
        year: p.year,
        repoUrl: p.repoUrl,
        demoUrl: p.demoUrl,
        tags: p.tags.map((ct) => ct.tag.name),
      }))}
    />
  );
}
