"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin emerald reading-progress bar pinned to the very top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.4,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-[#2DD4BF] via-[#0F766E] to-[#0B5B54] print:hidden"
    />
  );
}
