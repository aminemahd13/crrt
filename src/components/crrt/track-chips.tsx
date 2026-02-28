"use client";

import { motion } from "framer-motion";
import { Cpu, Brain, Rocket, Trophy, Zap, Server, Bot, Cog } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  cpu: Cpu,
  brain: Brain,
  rocket: Rocket,
  trophy: Trophy,
  zap: Zap,
  server: Server,
  bot: Bot,
  cog: Cog,
};

interface Track {
  tag: string;
  label: string;
  icon: string;
}

interface TrackChipsProps {
  tracks: Track[];
  activeTag?: string;
  onTagClick?: (tag: string) => void;
}

export function TrackChips({ tracks, activeTag, onTagClick }: TrackChipsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {tracks.map((track, i) => {
        const Icon = iconMap[track.icon] || Cog;
        const isActive = activeTag === track.tag;

        return (
          <motion.button
            key={track.tag}
            onClick={() => onTagClick?.(track.tag)}
            className={`track-chip ${isActive ? "active" : ""}`}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Icon size={14} />
            {track.label}
          </motion.button>
        );
      })}
    </div>
  );
}
