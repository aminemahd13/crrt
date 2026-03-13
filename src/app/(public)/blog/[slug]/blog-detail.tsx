"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Clock, List as ListIcon } from "lucide-react";

interface Post {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  createdAt: Date;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function BlogDetailView({ post }: { post: Post }) {
  const [progress, setProgress] = useState(0);
  const [showToc, setShowToc] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Extract headings for TOC
  const tocItems = useMemo<TocItem[]>(() => {
    const items: TocItem[] = [];
    const headingRegex = /^(#{2,3}) (.+)$/gm;
    let match;
    while ((match = headingRegex.exec(post.content)) !== null) {
      const level = match[1].length;
      const text = match[2].replace(/\*\*/g, "").trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      items.push({ id, text, level });
    }
    return items;
  }, [post.content]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);

      // Highlight active TOC heading
      const headings = document.querySelectorAll("h2[id], h3[id]");
      let currentId: string | null = null;
      headings.forEach((h) => {
        if ((h as HTMLElement).offsetTop <= scrollTop + 120) {
          currentId = h.id;
        }
      });
      setActiveId(currentId);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dateStr = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const wordCount = post.content.split(/\s+/).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  // Markdown rendering with heading IDs for TOC linking
  const contentHtml = post.content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="my-4 max-w-full overflow-x-auto rounded-xl border border-[var(--ghost-border)] bg-midnight p-4"><code class="block w-max min-w-full text-sm text-emerald-400">$2</code></pre>')
    .replace(/^### (.+)$/gm, (_m, text) => {
      const id = text.replace(/\*\*/g, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return `<h3 id="${id}" class="font-heading font-semibold text-lg text-ice-white mt-6 mb-2 scroll-mt-24">${text}</h3>`;
    })
    .replace(/^## (.+)$/gm, (_m, text) => {
      const id = text.replace(/\*\*/g, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return `<h2 id="${id}" class="font-heading font-bold text-xl text-ice-white mt-8 mb-3 scroll-mt-24">${text}</h2>`;
    })
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-ice-white font-medium">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="break-all text-xs bg-midnight-light px-1.5 py-0.5 rounded text-signal-orange border border-[var(--ghost-border)]">$1</code>')
    .replace(/^\|(.+)\|$/gm, (row) => {
      const cells = row.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) return "";
      const tag = row.includes("---") ? "th" : "td";
      return `<tr>${cells.map((c) => `<${tag} class="px-3 py-1.5 text-xs text-steel-gray border border-[var(--ghost-border)]">${c}</${tag}>`).join("")}</tr>`;
    })
    .replace(/(<tr>[\s\S]*<\/tr>)/g, '<table class="w-full my-4 border-collapse">$1</table>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="text-sm text-steel-gray mb-1 ml-4 list-decimal">$2</li>')
    .replace(/^- (.+)$/gm, '<li class="text-sm text-steel-gray mb-1 ml-4 list-disc">$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-signal-orange pl-4 text-sm text-steel-gray italic my-4">$1</blockquote>')
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

      <div className="max-w-5xl mx-auto px-6 py-12 flex gap-10">
        {/* TOC Sidebar */}
        {tocItems.length > 2 && (
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <button
                onClick={() => setShowToc(!showToc)}
                className="flex items-center gap-2 text-xs text-steel-gray hover:text-ice-white mb-3"
              >
                <ListIcon size={12} />
                Table of Contents
              </button>
              {showToc && (
                <nav className="space-y-0.5 border-l border-[var(--ghost-border)] pl-3">
                  {tocItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-xs py-1 transition-colors ${
                        item.level === 3 ? "pl-3" : ""
                      } ${
                        activeId === item.id
                          ? "text-signal-orange"
                          : "text-steel-gray hover:text-ice-white"
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              )}
            </div>
          </aside>
        )}

        {/* Article */}
        <article className={`min-w-0 max-w-3xl flex-1 ${tocItems.length <= 2 ? "mx-auto" : ""}`}>
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
            <div className="flex items-center gap-3 text-sm text-steel-gray">
              <Clock size={14} /> {dateStr}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--ghost-white)] border border-[var(--ghost-border)]">
                {readTime} min read
              </span>
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
            className="space-y-2 min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </article>
      </div>
    </>
  );
}
