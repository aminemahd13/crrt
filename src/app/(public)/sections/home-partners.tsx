"use client";

import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  if (partners.length === 0) return null;

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

      <div className="mx-auto max-w-4xl">
        <Carousel
          opts={{ align: "center", loop: true }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {partners.map((partner) => (
              <CarouselItem key={partner.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4">
                <a
                  href={partner.website ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-20 px-4 rounded-xl border border-[var(--ghost-border)] bg-midnight-light/50 opacity-60 hover:opacity-100 transition-all grayscale hover:grayscale-0 hover:border-signal-orange/30"
                  title={partner.name}
                >
                  <span className="font-heading font-bold text-lg text-steel-gray hover:text-ice-white transition-colors text-center">
                    {partner.name}
                  </span>
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>
          {partners.length > 4 && (
            <>
              <CarouselPrevious className="border-[var(--ghost-border)] bg-midnight text-steel-gray hover:text-ice-white hover:bg-white/5" />
              <CarouselNext className="border-[var(--ghost-border)] bg-midnight text-steel-gray hover:text-ice-white hover:bg-white/5" />
            </>
          )}
        </Carousel>
      </div>
    </section>
  );
}
