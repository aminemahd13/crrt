import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditPostClient } from "./edit-client";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return notFound();

  return <EditPostClient post={post} />;
}
