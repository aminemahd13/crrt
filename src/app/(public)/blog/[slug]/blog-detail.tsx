"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

interface Post {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  createdAt: Date;
}

export function BlogDetailView({ post }: { post: Post }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dateStr = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Simple markdown rendering
  const contentHtml = post.content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="my-4 p-4 rounded-xl bg-midnight border border-[var(--ghost-border)] overflow-x-auto"><code class="text-sm text-emerald-400">$2</code></pre>')
    .replace(/^### (.+)$/gm, '<h3 class="font-heading font-semibold text-lg text-ice-white mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-heading font-bold text-xl text-ice-white mt-8 mb-3">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-ice-white font-medium">$1</strong>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="text-sm text-steel-gray mb-1 ml-4 list-decimal">$2</li>')
    .replace(/^- (.+)$/gm, '<li class="text-sm text-steel-gray mb-1 ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '<p class="text-sm text-steel-gray leading-relaxed mb-4"></p>');

  return (
    <>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50">
        <div
          className="h-full bg-signal-orange transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-steel-gray hover:text-ice-white transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to Lab Notes
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 mb-10"
        >
          <div className="flex items-center gap-2 text-sm text-steel-gray">
            <Clock size={14} /> {dateStr}
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-ice-white leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-steel-gray leading-relaxed">{post.excerpt}</p>
          )}
          <div className="section-divider" />
        </motion.div>

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>
    </>
  );
}
