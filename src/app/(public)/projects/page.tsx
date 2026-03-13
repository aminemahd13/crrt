import { prisma } from "@/lib/prisma";
import { ProjectsPage } from "./projects-client";
import { toStringArray } from "@/lib/json";

export const dynamic = "force-dynamic";

export default async function ProjectsServerPage() {
  const projects = await prisma.project.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      status: true,
      stackTags: true,
      year: true,
      repoUrl: true,
      demoUrl: true,
      tags: {
        select: {
          tag: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return (
    <ProjectsPage
      projects={projects.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        status: p.status,
        stackTags: toStringArray(p.stackTags),
        year: p.year,
        repoUrl: p.repoUrl,
        demoUrl: p.demoUrl,
        tags: Array.from(new Set(p.tags.map((ct) => ct.tag.name))),
      }))}
    />
  );
}
