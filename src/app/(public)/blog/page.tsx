import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      createdAt: true,
    },
  });

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10 space-y-4">
        <h1 className="text-4xl font-heading font-bold text-ice-white">Lab Notes</h1>
        <p className="text-steel-gray max-w-lg">
          Technical guides, tutorials, and research notes from CRRT members.
        </p>
      </div>

      {posts.length === 0 ? (
        <Card className="border-[var(--ghost-border)] bg-midnight-light/50 py-0">
          <CardContent className="py-16 text-center">
            <p className="text-steel-gray text-sm">No posts published yet.</p>
          </CardContent>
        </Card>
      ) : (
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
                className="group block"
              >
                <Card className="border-[var(--ghost-border)] bg-midnight-light/50 hover:bg-white/[0.03] hover:border-signal-orange/30 transition-all duration-200 py-0">
                  <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 space-y-2 min-w-0">
                      <h2 className="font-heading font-semibold text-lg text-ice-white group-hover:text-signal-orange transition-colors truncate">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-steel-gray line-clamp-2">{post.excerpt}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="secondary" className="bg-[var(--ghost-white)] border-[var(--ghost-border)] text-steel-gray gap-1">
                        <Clock size={10} /> {dateStr}
                      </Badge>
                      <ArrowUpRight size={14} className="text-signal-orange opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
