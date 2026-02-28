"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  createdAt: Date;
}

interface HomePostsProps {
  posts: Post[];
}

export function HomePosts({ posts }: HomePostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="relative max-w-7xl mx-auto px-6 py-20">
      <div className="section-divider mb-16" />

      <motion.div
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-signal-orange" />
          <h2 className="font-heading font-bold text-2xl text-ice-white">
            Lab Notes
          </h2>
        </div>
        <Link
          href="/blog"
          className="text-sm text-steel-gray hover:text-ice-white transition-colors flex items-center gap-1"
        >
          All notes <ArrowUpRight size={14} />
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {posts.map((post, i) => {
          const dateStr = new Date(post.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          return (
            <motion.article
              key={post.id}
              className="glass-card p-6 space-y-3 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: i * 0.08,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="flex items-center gap-2 text-xs text-steel-gray">
                <Clock size={12} />
                {dateStr}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h3 className="font-heading font-semibold text-ice-white group-hover:text-signal-orange transition-colors leading-snug">
                  {post.title}
                </h3>
              </Link>
              {post.excerpt && (
                <p className="text-sm text-steel-gray leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
              )}
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1 text-xs text-signal-orange hover:underline pt-1"
              >
                Read more <ArrowUpRight size={12} />
              </Link>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
