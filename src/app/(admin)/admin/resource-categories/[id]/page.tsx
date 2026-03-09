import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CategoryFormClient } from "../new/category-form";

export default async function EditResourceCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.resourceCategory.findUnique({ where: { id } });
  if (!category) return notFound();

  return <CategoryFormClient category={category} />;
}
