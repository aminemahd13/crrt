"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Github, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  stackTags: string[];
  repoUrl?: string | null;
  demoUrl?: string | null;
}

interface HomeProjectsProps {
  projects: Project[];
}

export function HomeProjects({ projects }: HomeProjectsProps) {
  if (projects.length === 0) return null;

  return (
    <section className="relative max-w-7xl mx-auto px-6 py-20">
      <div className="section-divider mb-16" />

      <motion.div
        className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-signal-orange" />
          <h2 className="font-heading font-bold text-2xl text-ice-white">
            Featured Projects
          </h2>
        </div>
        <Link
          href="/projects"
          className="text-sm text-steel-gray hover:text-ice-white transition-colors flex items-center gap-1"
        >
          View all <ArrowUpRight size={14} />
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            className="glass-card p-6 space-y-4 flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: i * 0.08,
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {/* Status */}
            <div className="flex items-center justify-between">
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
              <div className="flex items-center gap-2">
                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-steel-gray hover:text-ice-white transition-colors"
                    aria-label="Repository"
                  >
                    <Github size={14} />
                  </a>
                )}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-steel-gray hover:text-ice-white transition-colors"
                    aria-label="Demo"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <Link href={`/projects/${project.slug}`} className="group">
              <h3 className="font-heading font-semibold text-lg text-ice-white group-hover:text-signal-orange transition-colors">
                {project.title}
              </h3>
            </Link>
            <p className="text-sm text-steel-gray leading-relaxed flex-1">
              {project.description}
            </p>

            {/* Stack Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {project.stackTags.slice(0, 4).map((tag: string) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] bg-[var(--ghost-white)] border-[var(--ghost-border)] text-steel-gray"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
