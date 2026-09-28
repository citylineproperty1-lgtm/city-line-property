"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LightboxProps {
  images: string[];
  index: number;
  alt: string;
  open: boolean;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

/** PDF items are rendered as an embedded document viewer instead of an image. */
const isPdf = (src: string) => src.toLowerCase().endsWith(".pdf");

export function Lightbox({ images, index, alt, open, onClose, onIndexChange }: LightboxProps) {
  const prev = useCallback(
    () => onIndexChange((index - 1 + images.length) % images.length),
    [index, images.length, onIndexChange]
  );
  const next = useCallback(
    () => onIndexChange((index + 1) % images.length),
    [index, images.length, onIndexChange]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, prev, next]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col bg-neutral-950/95 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery lightbox"
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-5 py-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-sm font-medium tabular-nums text-neutral-300">
              {index + 1} / {images.length}
            </span>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Image / PDF document */}
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-14"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={images[index]}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="relative h-full w-full"
              >
                {isPdf(images[index]) ? (
                  <div className="flex h-full w-full flex-col gap-2">
                    <iframe
                      src={images[index]}
                      title={`${alt} — document ${index + 1}`}
                      className="h-full w-full flex-1 rounded-xl bg-white"
                    />
                    <div className="flex justify-center">
                      <a
                        href={images[index]}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-white/20"
                      >
                        Open PDF in a new tab
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={images[index]}
                    alt={`${alt} — photo ${index + 1}`}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Arrows */}
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all hover:bg-white/25 active:scale-95 sm:left-5"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all hover:bg-white/25 active:scale-95 sm:right-5"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div
              className="flex items-center justify-center gap-2 overflow-x-auto px-5 py-4"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => onIndexChange(i)}
                  className={cn(
                    "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                    i === index
                      ? "border-white opacity-100"
                      : "border-transparent opacity-50 hover:opacity-90"
                  )}
                  aria-label={`Go to photo ${i + 1}`}
                >
                  {isPdf(img) ? (
                    <span className="flex h-full w-full items-center justify-center bg-white/10 text-white">
                      <FileText className="h-5 w-5" />
                    </span>
                  ) : (
                    <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
