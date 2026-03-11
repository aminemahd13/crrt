"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface LensCardProps {
  name: string;
  role?: string | null;
  image?: string | null;
  className?: string;
}

export function LensCard({ name, role, image, className = "" }: LensCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <motion.div
      className={`flex flex-col items-center gap-3 group ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Circular Lens Frame */}
      <div className="lens-frame w-24 h-24 ring-2 ring-[var(--ghost-border)] group-hover:ring-signal-orange/40 transition-all">
        {image ? (
          <Image
            src={image}
            alt={name}
            width={96}
            height={96}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-deep to-midnight flex items-center justify-center">
            <span className="font-heading font-bold text-lg text-signal-orange">{initials}</span>
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="font-heading font-semibold text-sm text-ice-white">{name}</p>
        {role && <p className="text-xs text-steel-gray mt-0.5">{role}</p>}
      </div>
    </motion.div>
  );
}
