import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditProjectClient } from "./edit-client";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return notFound();

  return (
    <EditProjectClient
      project={{
        ...project,
        stackTags: JSON.parse(project.stackTags).join(", "),
      }}
    />
  );
}
