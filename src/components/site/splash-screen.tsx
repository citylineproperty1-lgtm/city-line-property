"use client";

/**
 * Branded splash screen — an elegant preloader shown when the website opens
 * (reference: Tranzlo-style intro). Deep-teal brand surface, white lockup and
 * a thin white progress line that fills smoothly underneath, then a soft fade
 * into the app. Shown on every full page load; hash navigation never
 * re-triggers it because the SPA shell only mounts once.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Monogram } from "./logo";
import { BUSINESS } from "@/lib/business";

const MIN_MS = 2000; // always on screen at least this long (owner request: 2s)
const MAX_MS = 5000; // never longer, even if some asset stalls

export function SplashScreen() {
  const [minDone, setMinDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const min = window.setTimeout(
      () => setMinDone(true),
      reduce ? 450 : MIN_MS
    );

    const markReady = () => setReady(true);
    let max: number | undefined;
    if (document.readyState === "complete") {
      markReady();
    } else {
      window.addEventListener("load", markReady, { once: true });
      max = window.setTimeout(markReady, MAX_MS);
    }

    return () => {
      window.clearTimeout(min);
      if (max !== undefined) window.clearTimeout(max);
      window.removeEventListener("load", markReady);
    };
  }, [reduce]);

  // The splash hides once BOTH the minimum display time has elapsed and the
  // page has finished loading (or immediately when the visitor clicks/taps).
  const done = skipped || (minDone && ready);

  // Scroll lock is tied to the splash's VISIBILITY, not its lifetime — the
  // component stays mounted after the overlay is removed, so an unmount-only
  // cleanup would leave `overflow: hidden` on <body> forever (page freeze).
  useEffect(() => {
    if (done) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [done]);

  const skip = () => setSkipped(true);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="splash"
          role="status"
          aria-label={`${BUSINESS.name} — loading`}
          onClick={skip}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.025 }}
          transition={{ duration: reduce ? 0.25 : 0.55, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-[#115E56] via-[#0B443C] to-[#05201C] px-6"
        >
          {/* soft halo behind the lockup */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"
          />

          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <Monogram px={64} />
              <h1 className="mt-5 text-[26px] font-extrabold leading-none tracking-tight text-white sm:text-[30px]">
                {BUSINESS.name}
              </h1>
              <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.34em] text-white/60">
                {BUSINESS.taglineUpper}
              </p>
            </motion.div>

            {/* thin progress line — fills smoothly across the 2s hold, in the
                style of the owner's original reference (Tranzlo intro) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduce ? 0 : 0.35, duration: 0.4 }}
              className="mt-9 h-[3px] w-52 overflow-hidden rounded-full bg-white/20 sm:w-60"
            >
              <motion.span
                className="block h-full rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.55)]"
                initial={{ width: "4%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: reduce ? 0.35 : 1.8,
                  ease: [0.22, 0.61, 0.36, 1],
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
