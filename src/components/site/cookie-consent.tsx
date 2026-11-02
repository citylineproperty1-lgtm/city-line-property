"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ShieldCheck } from "lucide-react";
import { useAppStore } from "@/lib/store";

/**
 * Cookie consent banner (bottom bar, brand-dark like the footer).
 *
 * - Analytics (Google Analytics) stays completely OFF until the visitor
 *   presses "Accept all" — the gtag script is never even downloaded before
 *   that (see analytics-gate.tsx).
 * - The choice is remembered in localStorage and the banner never returns
 *   until the browser data is cleared.
 * - Hidden on the admin panel.
 */

/** localStorage key holding the visitor's consent choice. */
export const CONSENT_KEY = "clp-cookie-consent";
/** Window event fired when consent is granted (AnalyticsGate listens). */
export const CONSENT_EVENT = "clp:consent";

type Choice = "accepted" | "declined";

// Splash screen keeps a 2s minimum (owner request) — let it clear first.
const SHOW_DELAY_MS = 2300;

export function CookieConsent() {
  const [state, setState] = useState<{
    ready: boolean;
    choice: Choice | null;
    show: boolean;
  }>({ ready: false, choice: null, show: false });
  const { ready, choice, show } = state;
  const view = useAppStore((s) => s.view);
  const navigate = useAppStore((s) => s.navigate);

  useEffect(() => {
    let stored: Choice | null = null;
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (raw === "accepted" || raw === "declined") stored = raw;
    } catch {
      /* private mode / storage disabled — just don't persist the choice */
    }
    // No stored choice → slide the banner in after the splash screen clears
    // (all state updates inside the timer keep the effect lint-clean).
    const t = window.setTimeout(
      () => setState({ ready: true, choice: stored, show: !stored }),
      stored ? 0 : SHOW_DELAY_MS
    );
    return () => window.clearTimeout(t);
  }, []);

  const decide = (next: Choice) => {
    try {
      localStorage.setItem(CONSENT_KEY, next);
    } catch {
      /* ignore — banner still hides for this visit */
    }
    setState((s) => ({ ...s, choice: next, show: false }));
    if (next === "accepted") {
      // AnalyticsGate picks this up and injects gtag.js.
      window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
    }
  };

  // Not hydrated yet / already decided / admin panel → nothing.
  if (!ready || choice || view.name === "admin") return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 110, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 110, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-[130] print:hidden"
          role="dialog"
          aria-modal="false"
          aria-label="Cookie consent"
        >
          <div className="relative bg-[#0B0F0E]/[0.98] shadow-[0_-24px_60px_-24px_rgba(0,0,0,0.7)] backdrop-blur">
            {/* Brand gradient hairline on top — same as the footer */}
            <div aria-hidden className="gradient-hairline absolute inset-x-0 top-0" />

            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 md:flex-row md:items-center md:gap-6 md:py-5">
              {/* Icon */}
              <div
                aria-hidden
                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0F766E]/25 text-[#2DD4BF] ring-1 ring-[#0F766E]/50 md:flex"
              >
                <ShieldCheck className="h-5 w-5" />
              </div>

              {/* Copy */}
              <div className="min-w-0 md:flex-1">
                <p className="text-[15px] font-semibold text-white">
                  We value your privacy
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-white/70">
                  We use cookies to measure site usage and improve City Line
                  Property. Analytics stays off until you accept. Read our{" "}
                  <button
                    onClick={() => navigate({ name: "privacy" })}
                    className="font-semibold text-[#5EB9A9] underline-offset-2 transition-colors hover:text-[#7FE0CD] hover:underline"
                  >
                    Privacy Policy
                  </button>
                  .
                </p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 gap-3 sm:gap-3.5">
                <button
                  onClick={() => decide("declined")}
                  className="min-h-[44px] flex-1 rounded-full border border-white/25 bg-white/5 px-6 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-white/10 md:flex-none"
                >
                  Decline
                </button>
                <button
                  onClick={() => decide("accepted")}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full bg-[#0F766E] px-6 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-10px_rgba(15,118,110,0.9)] transition-colors hover:bg-[#0D655D] md:flex-none"
                >
                  <Check className="h-4 w-4" aria-hidden />
                  Accept all
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
