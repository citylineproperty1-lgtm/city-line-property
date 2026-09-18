"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin gold reading-progress bar pinned to the very top of the viewport. */
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
      className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-[#E9CE7A] via-[#C9A227] to-[#9A7B1A] print:hidden"
    />
  );
}
