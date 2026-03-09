import { ResourceFormClient } from "./resource-form";
import { prisma } from "@/lib/prisma";

export default async function NewResourcePage() {
  const categories = await prisma.resourceCategory.findMany({ orderBy: { name: "asc" } });
  
  return <ResourceFormClient resource={null} categories={categories} />;
}
