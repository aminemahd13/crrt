"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface LabGalleryProps {
  images: { src: string; alt: string; caption?: string }[];
}

export function LabGallery({ images }: LabGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images.length) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
  };

  const goNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % images.length);
  };

  return (
    <>
      {/* Contact-sheet grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => openLightbox(i)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-midnight border border-[var(--ghost-border)] hover:border-signal-orange/30 transition-all"
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-2">
              {img.caption && (
                <span className="text-[10px] text-ice-white/80 truncate">{img.caption}</span>
              )}
              <Maximize2 size={12} className="text-ice-white/60 shrink-0" />
            </div>
            {/* Film frame border */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-signal-orange/20 rounded-lg transition-colors pointer-events-none" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-ice-white hover:bg-white/20 transition-colors z-10"
          >
            <X size={18} />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-xs text-steel-gray font-mono">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-ice-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Image */}
          <div
            className="max-w-[85vw] max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex].src}
              alt={images[lightboxIndex].alt}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {images[lightboxIndex].caption && (
              <p className="mt-3 text-sm text-steel-gray text-center">
                {images[lightboxIndex].caption}
              </p>
            )}
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-ice-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={20} />
          </button>

          {/* Thumbnail strip */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                  i === lightboxIndex
                    ? "border-signal-orange scale-110"
                    : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
