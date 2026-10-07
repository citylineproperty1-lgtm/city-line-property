"use client";

/**
 * Branded splash screen — an elegant preloader shown when the website opens
 * (reference: Tranzlo-style intro). Monogram + wordmark centered on a clean
 * surface with a travelling teal wave line underneath, then a soft fade into
 * the app. Shown on every full page load; hash navigation never re-triggers
 * it because the SPA shell only mounts once.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Monogram } from "./logo";
import { BUSINESS } from "@/lib/business";

const MIN_MS = 3000; // always on screen at least this long (owner request: 3s)
const MAX_MS = 5000; // never longer, even if some asset stalls

// Seamless sine-wave path: 40px wavelength, drawn 320px wide (8 periods) so a
// 40px horizontal loop never shows an edge inside the 240px container.
const WAVE_PATH =
  "M0 8 Q10 1 20 8 T40 8 T60 8 T80 8 T100 8 T120 8 T140 8 T160 8 T180 8 T200 8 T220 8 T240 8 T260 8 T280 8 T300 8 T320 8";

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
    // Lock page scroll while the splash is up.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

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
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(min);
      if (max !== undefined) window.clearTimeout(max);
      window.removeEventListener("load", markReady);
    };
  }, [reduce]);

  // The splash hides once BOTH the minimum display time has elapsed and the
  // page has finished loading (or immediately when the visitor clicks/taps).
  const done = skipped || (minDone && ready);

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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background px-6"
        >
          {/* soft brand glow behind the lockup */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
          />

          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <Monogram px={64} />
              <h1 className="mt-5 text-[26px] font-extrabold leading-none tracking-tight text-primary sm:text-[30px]">
                {BUSINESS.name}
              </h1>
              <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.34em] text-primary/60">
                {BUSINESS.taglineUpper}
              </p>
            </motion.div>

            {/* travelling wave line — two layered teal waves in opposite
                phase, fading out at both ends (owner request: wave style) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduce ? 0 : 0.35, duration: 0.4 }}
              style={FADE_MASK}
              className="relative mt-8 h-4 w-52 overflow-hidden text-primary sm:w-60"
            >
              {/* back wave — slower, fainter, half-period phase shift */}
              <motion.svg
                aria-hidden
                viewBox="0 0 320 16"
                width={320}
                height={16}
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
                  className="opacity-30"
                />
              </motion.svg>

              {/* front wave — the main travelling line */}
              <motion.svg
                aria-hidden
                viewBox="0 0 320 16"
                width={320}
                height={16}
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
