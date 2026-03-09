"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LensCard } from "@/components/crrt/lens-card";
import { BlueprintTimeline } from "@/components/crrt/blueprint-timeline";
import { LabGallery } from "@/components/crrt/lab-gallery";

interface Speaker {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  image: string | null;
}

interface EventDetailProps {
  event: {
    title: string;
    slug: string;
    description: string;
    content: string;
    type: string;
    startDate: string;
    endDate: string | null;
    location: string | null;
    capacity: number | null;
    speakers: Speaker[];
    tags: string[];
  };
}

export function EventDetail({ event }: EventDetailProps) {
  const dateStr = new Date(event.startDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = new Date(event.startDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Parse content sections for timeline
  const sections = event.content
    .split(/^## /m)
    .filter(Boolean)
    .map((s, i) => {
      const lines = s.trim().split("\n");
      return { id: `agenda-${i}`, year: i + 1, title: lines[0], description: lines.slice(1).join("\n").trim() };
    });

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      {/* Back */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm text-steel-gray hover:text-ice-white transition-colors mb-8"
      >
        <ArrowLeft size={16} /> Back to Events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main */}
        <div className="lg:col-span-2 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center text-xs font-medium px-3 py-1 rounded-full bg-signal-orange/10 border border-signal-orange/20 text-signal-orange uppercase tracking-wider mb-4">
              {event.type}
            </span>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-ice-white mb-4">
              {event.title}
            </h1>
            <p className="text-steel-gray text-lg leading-relaxed">
              {event.description}
            </p>
          </motion.div>

          {/* Agenda Timeline */}
          {sections.length > 0 && (
            <div>
              <h2 className="flex items-center gap-3 font-heading font-bold text-xl text-ice-white mb-6">
                <div className="w-1 h-5 rounded-full bg-signal-orange" />
                Agenda
              </h2>
              <BlueprintTimeline
                milestones={sections.map((s) => ({
                  id: s.id,
                  year: s.year,
                  title: s.title,
                  description: s.description,
                }))}
              />
            </div>
          )}

          {/* Speakers */}
          {event.speakers.length > 0 && (
            <div>
              <h2 className="flex items-center gap-3 font-heading font-bold text-xl text-ice-white mb-6">
                <div className="w-1 h-5 rounded-full bg-signal-orange" />
                Speakers
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {event.speakers.map((speaker, index) => (
                  <motion.div
                    key={speaker.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                     <LensCard
                       name={speaker.name}
                       role={speaker.role || "Speaker"}
                       image={speaker.image || "/images/placeholder.svg"}
                     />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {(() => {
            const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
            const images: { src: string; alt: string; caption?: string }[] = [];
            let match;
            while ((match = imgRegex.exec(event.content)) !== null) {
              images.push({ src: match[2], alt: match[1] || event.title, caption: match[1] || undefined });
            }
            if (images.length === 0) return null;
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="flex items-center gap-3 font-heading font-bold text-xl text-ice-white mb-6">
                  <div className="w-1 h-5 rounded-full bg-signal-orange" />
                  Gallery
                </h2>
                <LabGallery images={images} />
              </motion.div>
            );
          })()}
        </div>

        {/* Sticky Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-heading font-semibold text-ice-white">Event Details</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-signal-orange mt-0.5" />
                  <div>
                    <p className="text-sm text-ice-white">{dateStr}</p>
                    <p className="text-xs text-steel-gray">{timeStr}</p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-signal-orange mt-0.5" />
                    <p className="text-sm text-ice-white">{event.location}</p>
                  </div>
                )}

                {event.capacity && (
                  <div className="flex items-start gap-3">
                    <Users size={16} className="text-signal-orange mt-0.5" />
                    <p className="text-sm text-ice-white">{event.capacity} spots</p>
                  </div>
                )}
              </div>

              {event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {Array.from(new Set(event.tags)).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--ghost-white)] border border-[var(--ghost-border)] text-steel-gray"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button className="w-full py-3 rounded-xl bg-signal-orange text-white font-medium text-sm hover:bg-[var(--signal-orange-hover)] transition-colors">
                Register Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
