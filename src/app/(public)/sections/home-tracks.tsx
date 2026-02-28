"use client";

import { motion } from "framer-motion";
import { TrackChips } from "@/components/crrt/track-chips";

interface HomeTracksProps {
  tracks: { tag: string; label: string; icon: string }[];
}

export function HomeTracks({ tracks }: HomeTracksProps) {
  if (tracks.length === 0) return null;

  return (
    <section className="relative max-w-7xl mx-auto px-6 py-20">
      <div className="section-divider mb-16" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 rounded-full bg-signal-orange" />
          <h2 className="font-heading font-bold text-2xl text-ice-white">
            Current Tracks
          </h2>
        </div>
        <p className="text-steel-gray text-sm max-w-lg">
          Active research and training domains. Each track maps to ongoing projects, events, and resources.
        </p>
        <TrackChips tracks={tracks} />
      </motion.div>
    </section>
  );
}
