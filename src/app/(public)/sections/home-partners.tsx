"use client";

import { motion } from "framer-motion";

interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  website?: string | null;
}

interface HomePartnersProps {
  partners: Partner[];
}

export function HomePartners({ partners }: HomePartnersProps) {
  return (
    <section className="relative max-w-7xl mx-auto px-6 py-20">
      <div className="section-divider mb-16" />

      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="font-heading font-bold text-xl text-ice-white mb-2">
          Partners & Supporters
        </h2>
        <p className="text-sm text-steel-gray">Organizations backing our mission.</p>
      </motion.div>

      <div className="flex items-center justify-center gap-12 flex-wrap">
        {partners.map((partner, i) => (
          <motion.a
            key={partner.id}
            href={partner.website ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-12 px-4 opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.4 }}
            whileHover={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            title={partner.name}
          >
            <span className="font-heading font-bold text-lg text-steel-gray hover:text-ice-white transition-colors">
              {partner.name}
            </span>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
