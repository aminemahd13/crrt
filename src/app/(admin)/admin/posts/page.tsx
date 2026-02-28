import { prisma } from "@/lib/prisma";
import { ContentListClient } from "@/components/admin/content-list";

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <ContentListClient
      title="Posts"
      description="Manage blog posts and lab notes."
      createHref="/admin/posts/new"
      items={posts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.published ? "published" : "draft",
        date: p.createdAt.toISOString(),
        editHref: `/admin/posts/${p.id}`,
      }))}
      contentType="posts"
    />
  );
}
