import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10 space-y-4">
        <h1 className="text-4xl font-heading font-bold text-ice-white">Lab Notes</h1>
        <p className="text-steel-gray max-w-lg">
          Technical guides, tutorials, and research notes from CRRT members.
        </p>
      </div>

      <div className="space-y-4">
        {posts.map((post) => {
          const dateStr = new Date(post.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });

          return (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="glass-card p-6 flex flex-col sm:flex-row sm:items-center gap-4 group block"
            >
              <div className="flex-1 space-y-2">
                <h2 className="font-heading font-semibold text-lg text-ice-white group-hover:text-signal-orange transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-steel-gray line-clamp-2">{post.excerpt}</p>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-steel-gray shrink-0">
                <span className="flex items-center gap-1"><Clock size={12} /> {dateStr}</span>
                <ArrowUpRight size={14} className="text-signal-orange opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
