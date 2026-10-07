"use client";

/**
 * Branded splash screen — an elegant preloader shown when the website opens
 * (reference: Tranzlo-style intro). Deep-teal brand surface, white lockup and
 * a travelling white wave line underneath, then a soft fade into the app.
 * Shown on every full page load; hash navigation never re-triggers it because
 * the SPA shell only mounts once.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Monogram } from "./logo";
import { BUSINESS } from "@/lib/business";

const MIN_MS = 3000; // always on screen at least this long (owner request: 3s)
const MAX_MS = 5000; // never longer, even if some asset stalls

// Seamless sine-wave path: 40px wavelength, drawn 320px wide (8 periods) so a
// 40px horizontal loop never shows an edge inside the 240px container.
// Amplitude is deliberately tall (owner request) — control points swing the
// curve ±6px around the center line.
const WAVE_PATH =
  "M0 10 Q10 -2 20 10 T40 10 T60 10 T80 10 T100 10 T120 10 T140 10 T160 10 T180 10 T200 10 T220 10 T240 10 T260 10 T280 10 T300 10 T320 10";

// Fade the wave out at both ends so it melts into the background.
const FADE_MASK: React.CSSProperties = {
  maskImage:
    "linear-gradient(to right, transparent, black 14%, black 86%, transparent)",
  WebkitMaskImage:
    "linear-gradient(to right, transparent, black 14%, black 86%, transparent)",
};

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

            {/* travelling wave line — two layered white waves in opposite
                phase, fading out at both ends (owner request: wave style) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduce ? 0 : 0.35, duration: 0.4 }}
              style={FADE_MASK}
              className="relative mt-8 h-5 w-52 overflow-hidden text-white sm:w-60"
            >
              {/* back wave — slower, fainter, half-period phase shift */}
              <motion.svg
                aria-hidden
                viewBox="0 0 320 20"
                width={320}
                height={20}
                fill="none"
                className="absolute left-0 top-0"
                initial={reduce ? { x: -20 } : undefined}
                animate={reduce ? undefined : { x: [-20, -60] }}
                transition={{
                  duration: 1.7,
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                <path
                  d={WAVE_PATH}
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="opacity-40"
                />
              </motion.svg>

              {/* front wave — the main travelling line */}
              <motion.svg
                aria-hidden
                viewBox="0 0 320 20"
                width={320}
                height={20}
                fill="none"
                className="absolute left-0 top-0"
                animate={reduce ? undefined : { x: [0, -40] }}
                transition={{
                  duration: 1.15,
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                <path
                  d={WAVE_PATH}
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              </motion.svg>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
