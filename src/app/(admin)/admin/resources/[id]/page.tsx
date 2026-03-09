import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ResourceFormClient } from "../new/resource-form";

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [resource, categories] = await Promise.all([
    prisma.resource.findUnique({ where: { id } }),
    prisma.resourceCategory.findMany({ orderBy: { name: "asc" } })
  ]);
  
  if (!resource) return notFound();

  return <ResourceFormClient resource={resource} categories={categories} />;
}
