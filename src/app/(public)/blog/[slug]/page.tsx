import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BlogDetailView } from "./blog-detail";

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) return notFound();

  return <BlogDetailView post={post} />;
}
