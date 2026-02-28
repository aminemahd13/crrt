"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Github, ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LabGallery } from "@/components/crrt/lab-gallery";

interface ProjectDetailViewProps {
  project: {
    title: string;
    slug: string;
    description: string;
    content: string;
    status: string;
    stackTags: string[];
    year: number | null;
    repoUrl: string | null;
    demoUrl: string | null;
    tags: string[];
  };
}

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  // Parse images from content for the gallery
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const galleryImages: { src: string; alt: string; caption?: string }[] = [];
  let imgMatch;
  while ((imgMatch = imgRegex.exec(project.content)) !== null) {
    galleryImages.push({
      src: imgMatch[2],
      alt: imgMatch[1] || project.title,
      caption: imgMatch[1] || undefined,
    });
  }

  // Enhanced markdown rendering
  const contentHtml = project.content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="my-4 p-4 rounded-xl bg-midnight border border-[var(--ghost-border)] overflow-x-auto"><code class="text-sm text-emerald-400">$2</code></pre>')
    .replace(/^### (.+)$/gm, '<h3 class="font-heading font-semibold text-lg text-ice-white mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-heading font-bold text-xl text-ice-white mt-8 mb-3 flex items-center gap-2"><span class="w-1 h-5 rounded-full bg-signal-orange inline-block"></span>$1</h2>')
    .replace(/^\|(.+)\|$/gm, (row) => {
      const cells = row.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) return "";
      return `<tr>${cells.map((c) => `<td class="px-3 py-1.5 text-xs text-steel-gray border border-[var(--ghost-border)]">${c}</td>`).join("")}</tr>`;
    })
    .replace(/(<tr>[\s\S]*?<\/tr>)/g, '<table class="w-full my-4 border-collapse">$1</table>')
    .replace(/- \*\*(.+?)\*\*: (.+)$/gm, '<li class="text-sm text-steel-gray mb-1"><span class="text-ice-white font-medium">$1</span>: $2</li>')
    .replace(/^- (✅|🔄|⬜) (.+)$/gm, '<li class="text-sm text-steel-gray mb-1">$1 $2</li>')
    .replace(/^- (.+)$/gm, '<li class="text-sm text-steel-gray mb-1">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="text-sm text-steel-gray mb-1 ml-4 list-decimal">$1</li>')
    .replace(/`([^`]+)`/g, '<code class="text-xs bg-midnight-light px-1.5 py-0.5 rounded text-signal-orange border border-[var(--ghost-border)]">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-ice-white font-medium">$1</strong>')
    .replace(/\n\n/g, '<br/><br/>');

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-steel-gray hover:text-ice-white transition-colors mb-8"
      >
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${
              project.status === "ongoing"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            }`}
          >
            {project.status === "ongoing" && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
            {project.status}
          </span>
          {project.year && <span className="text-xs text-steel-gray">{project.year}</span>}
        </div>

        <h1 className="text-3xl md:text-4xl font-heading font-bold text-ice-white">
          {project.title}
        </h1>

        <p className="text-steel-gray text-lg leading-relaxed">{project.description}</p>

        {/* Stack Tags */}
        <div className="flex flex-wrap gap-2">
          {project.stackTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-[var(--ghost-white)] border-[var(--ghost-border)] text-steel-gray"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Links */}
        <div className="flex items-center gap-4">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--ghost-border)] text-sm text-ice-white hover:bg-white/5 transition-colors"
            >
              <Github size={16} /> Repository
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-signal-orange text-white text-sm hover:bg-[var(--signal-orange-hover)] transition-colors"
            >
              <ExternalLink size={16} /> Live Demo
            </a>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="mt-12 glass-card p-8 prose-invert"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="flex items-center gap-3 font-heading font-bold text-xl text-ice-white mb-6">
            <div className="w-1 h-5 rounded-full bg-signal-orange" />
            Gallery
          </h2>
          <LabGallery images={galleryImages} />
        </motion.div>
      )}

      {/* Join this project */}
      {project.status === "ongoing" && (
        <motion.div
          className="mt-12 glass-card p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <FileText size={24} className="mx-auto text-signal-orange mb-3" />
          <h3 className="font-heading font-bold text-lg text-ice-white mb-2">
            Interested in joining this project?
          </h3>
          <p className="text-sm text-steel-gray mb-6 max-w-md mx-auto">
            We're always looking for motivated team members. Fill out our membership application to get involved.
          </p>
          <Link
            href="/forms/membership-application"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-signal-orange text-white text-sm font-medium hover:bg-[var(--signal-orange-hover)] transition-colors"
          >
            Apply to Join
          </Link>
        </motion.div>
      )}
    </section>
  );
}
