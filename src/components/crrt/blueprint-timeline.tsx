"use client";

import { motion } from "framer-motion";

interface Milestone {
  year: number;
  title: string;
  description?: string | null;
}

interface BlueprintTimelineProps {
  milestones: Milestone[];
}

export function BlueprintTimeline({ milestones }: BlueprintTimelineProps) {
  return (
    <div className="relative">
      {/* Central trace line */}
      <div className="absolute left-5 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-signal-orange/40 via-[var(--ghost-border)] to-transparent" />

      <div className="space-y-8 md:space-y-12">
        {milestones.map((milestone, i) => {
          const isLeft = i % 2 === 0;
          return (
            <motion.div
              key={milestone.year}
              className={`relative flex items-start gap-6 ${
                isLeft ? "md:flex-row" : "md:flex-row-reverse"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                delay: i * 0.1,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Node dot */}
              <div className="absolute left-5 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-signal-orange border-2 border-midnight z-10 mt-1.5" />

              {/* Content */}
              <div
                className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${
                  isLeft ? "md:text-right md:pr-8" : "md:text-left md:pl-8"
                }`}
              >
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-signal-orange/10 text-signal-orange text-xs font-heading font-bold tracking-wider mb-2">
                  {milestone.year}
                </span>
                <h4 className="font-heading font-semibold text-ice-white text-lg mb-1">
                  {milestone.title}
                </h4>
                {milestone.description && (
                  <p className="text-sm text-steel-gray leading-relaxed">
                    {milestone.description}
                  </p>
                )}
              </div>

              {/* Spacer for opposite side */}
              <div className="hidden md:block md:w-[calc(50%-2rem)]" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
