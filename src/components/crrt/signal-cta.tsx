"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SignalCTAProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  className?: string;
}

export function SignalCTA({ href, children, variant = "primary", className = "" }: SignalCTAProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pulsed, setPulsed] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !pulsed) {
          setPulsed(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [pulsed]);

  const baseClasses =
    variant === "primary"
      ? "bg-signal-orange text-white hover:bg-[var(--signal-orange-hover)]"
      : "border border-signal-orange/30 text-signal-orange hover:bg-signal-orange/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        ref={ref}
        href={href}
        className={`
          inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm
          transition-all duration-200
          ${baseClasses}
          ${pulsed ? "signal-pulse" : ""}
          ${className}
          group
        `}
      >
        {children}
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  );
}
