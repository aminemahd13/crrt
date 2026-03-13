"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BlueprintTimeline } from "@/components/crrt/blueprint-timeline";
import { LensCard } from "@/components/crrt/lens-card";
import type { AboutConfigSnapshot } from "@/lib/about-config";

interface Milestone {
  id: string;
  year: number;
  title: string;
  description: string | null;
}

interface Member {
  id: string;
  name: string;
  role: string;
  image: string | null;
  isAlumni: boolean;
}

interface AboutPageProps {
  config: AboutConfigSnapshot;
  milestones: Milestone[];
  members: Member[];
}

export function AboutPage({ config, milestones, members }: AboutPageProps) {
  const [showAlumni, setShowAlumni] = useState(false);
  const displayedMembers = members.filter((m) => m.isAlumni === showAlumni);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12 space-y-20">
      {/* Mission */}
      <motion.div
        className="max-w-3xl space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-4xl font-heading font-bold text-ice-white">{config.heroTitle}</h1>
        <p className="text-steel-gray text-lg leading-relaxed">
          {config.storyText}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {config.valueCards.map((v, i) => (
            <motion.div
              key={v.title}
              className="glass-card p-5 space-y-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <h3 className="font-heading font-semibold text-signal-orange">{v.title}</h3>
              <p className="text-sm text-steel-gray leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="section-divider" />

      {/* Team */}
      <div id="team">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-signal-orange" />
            <h2 className="font-heading font-bold text-2xl text-ice-white">
              {showAlumni ? config.teamAlumniLabel : config.teamCurrentLabel}
            </h2>
          </div>
          <button
            onClick={() => setShowAlumni(!showAlumni)}
            className="text-sm text-steel-gray hover:text-ice-white transition-colors border border-[var(--ghost-border)] px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            {showAlumni ? "Show Current" : "Show Alumni"}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {displayedMembers.map((member) => (
            <LensCard
              key={member.id}
              name={member.name}
              role={member.role}
              image={member.image}
            />
          ))}
          {displayedMembers.length === 0 && (
            <p className="text-steel-gray text-sm col-span-full text-center py-8">
              No {showAlumni ? "alumni" : "current members"} to display.
            </p>
          )}
        </div>
      </div>

      <div className="section-divider" />

      {/* Timeline */}
      <div id="timeline">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 rounded-full bg-signal-orange" />
          <h2 className="font-heading font-bold text-2xl text-ice-white">
            {config.timelineHeading}
          </h2>
        </div>
        <BlueprintTimeline milestones={milestones} />
      </div>
    </section>
  );
}
