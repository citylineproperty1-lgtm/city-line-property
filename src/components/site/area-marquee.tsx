"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const AREAS = [
  "DHA Phase 6",
  "Clifton Block 2",
  "PECHS Block 6",
  "Bahria Town",
  "Gulshan-e-Iqbal",
  "North Nazimabad",
  "Bath Island",
  "Scheme 33",
  "DHA Phase 8",
  "KDA Scheme 1",
  "Gulberg Town",
  "Sea View",
];

export function AreaMarquee() {
  const items = [...AREAS, ...AREAS]; // duplicated for seamless loop

  return (
    <section aria-label="Areas we cover" className="relative mt-14 overflow-hidden border-y border-neutral-100 bg-neutral-50/60 py-4">
      <motion.div
        className="flex w-max items-center gap-8"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 36, ease: "linear", repeat: Infinity }}
      >
        {items.map((area, i) => (
          <span
            key={area + i}
            className="flex items-center gap-2 whitespace-nowrap text-[13px] font-medium tracking-wide text-neutral-400"
          >
            <MapPin className="h-3.5 w-3.5 text-neutral-300" />
            {area}
            <span className="ml-6 h-1 w-1 rounded-full bg-neutral-200" aria-hidden="true" />
          </span>
        ))}
      </motion.div>
      {/* edge fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent" />
    </section>
  );
}
