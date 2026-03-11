import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProjectDetailView } from "./project-detail";
import { toStringArray } from "@/lib/json";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    include: { tags: { include: { tag: true } } },
  });

  if (!project || !project.published) return notFound();

  return (
    <ProjectDetailView
      project={{
        ...project,
        stackTags: toStringArray(project.stackTags),
        tags: Array.from(new Set(project.tags.map((ct) => ct.tag.name))),
      }}
    />
  );
}
