"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Github, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  stackTags: string[];
  year: number | null;
  repoUrl: string | null;
  demoUrl: string | null;
  tags: string[];
}

export function ProjectsPage({ projects }: { projects: ProjectItem[] }) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filtered = projects.filter((p) => !statusFilter || p.status === statusFilter);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <motion.div
        className="mb-10 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-4xl font-heading font-bold text-ice-white">Build Archive</h1>
        <p className="text-steel-gray max-w-lg">
          Robotics projects, IoT systems, and research prototypes built by CRRT members.
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[null, "ongoing", "completed"].map((s) => (
          <button
            key={s ?? "all"}
            onClick={() => setStatusFilter(s)}
            className={`track-chip ${statusFilter === s ? "active" : ""}`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((project, i) => (
          <motion.div
            key={project.id}
            className="glass-card p-6 space-y-4 flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
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
              {project.year && (
                <span className="text-xs text-steel-gray">{project.year}</span>
              )}
            </div>

            <Link href={`/projects/${project.slug}`} className="group">
              <h3 className="font-heading font-semibold text-lg text-ice-white group-hover:text-signal-orange transition-colors">
                {project.title}
              </h3>
            </Link>

            <p className="text-sm text-steel-gray leading-relaxed flex-1">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {project.stackTags.slice(0, 5).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] bg-[var(--ghost-white)] border-[var(--ghost-border)] text-steel-gray"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              {project.repoUrl && (
                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-steel-gray hover:text-ice-white transition-colors">
                  <Github size={13} /> Repo
                </a>
              )}
              {project.demoUrl && (
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-steel-gray hover:text-ice-white transition-colors">
                  <ExternalLink size={13} /> Demo
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
