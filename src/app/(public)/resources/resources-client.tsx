"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Link as LinkIcon, Video, Folder, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ResourceItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string;
  type: string;
  createdAt: string;
}

interface ResourceCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  resources: ResourceItem[];
}

const typeIcons: Record<string, React.ReactNode> = {
  document: <FileText size={18} />,
  video: <Video size={18} />,
  link: <LinkIcon size={18} />,
  repository: <Folder size={18} />,
};

const typeColors: Record<string, string> = {
  document: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  video: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  link: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  repository: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export function ResourcesPage({ categories }: { categories: ResourceCategoryItem[] }) {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.slug || "");

  if (categories.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-heading font-bold text-ice-white mb-4">Resource Library</h1>
        <p className="text-steel-gray">No resources are currently available.</p>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div
        className="mb-10 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-4xl font-heading font-bold text-ice-white">Resource Library</h1>
        <p className="text-steel-gray max-w-lg">
          Explore our collection of tutorials, schematics, CAD designs, and codebase templates.
        </p>
      </motion.div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <div className="flex overflow-x-auto pb-4 mb-6 hide-scrollbar">
          <TabsList className="bg-[var(--ghost-white)] border border-[var(--ghost-border)] flex-shrink-0">
            {categories.map((category) => (
              <TabsTrigger
                key={category.slug}
                value={category.slug}
                className="data-[state=active]:bg-signal-orange data-[state=active]:text-white px-4 py-2"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {categories.map((category) => (
          <TabsContent key={category.slug} value={category.slug} className="mt-0">
            {category.description && (
              <p className="text-steel-gray mb-8">{category.description}</p>
            )}

            {category.resources.length === 0 ? (
              <div className="text-center py-20 glass-card">
                <p className="text-steel-gray text-sm">No resources in this category yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {category.resources.map((resource, i) => (
                  <motion.div
                    key={resource.id}
                    className="glass-card p-6 flex flex-col justify-between group hover:border-signal-orange/50 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <span
                          className={`inline-flex items-center justify-center p-2 rounded-lg border ${
                            typeColors[resource.type] || typeColors.link
                          }`}
                        >
                          {typeIcons[resource.type] || <FileText size={18} />}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-steel-gray">
                          {resource.type}
                        </span>
                      </div>
                      <h3 className="font-heading font-semibold text-lg text-ice-white mb-2 leading-snug">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-steel-gray line-clamp-3 leading-relaxed mb-6">
                        {resource.description}
                      </p>
                    </div>

                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-signal-orange hover:text-white transition-colors"
                    >
                      Access Resource <ExternalLink size={14} />
                    </a>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
