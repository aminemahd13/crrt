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
        <h2 className="font-heading font-bold text-2xl md:text-3xl text-ice-white mb-2">
          Partners & Supporters
        </h2>
        <p className="text-base text-steel-gray">Organizations backing our mission.</p>
      </motion.div>

      <div className="mx-auto max-w-5xl">
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
                  className="group flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--ghost-border)] bg-midnight-light/70 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-signal-orange/40 hover:bg-midnight-light"
                  title={partner.name}
                >
                  <img
                    src={partner.logoUrl}
                    alt={`${partner.name} logo`}
                    loading="lazy"
                    className="h-11 w-auto max-w-[140px] object-contain"
                  />
                  <span className="text-center font-heading text-sm font-semibold text-ice-white/90 transition-colors group-hover:text-ice-white">
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
