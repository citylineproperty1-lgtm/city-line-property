"use client";

/**
 * ContactBubble — small "contact us for any information" popup.
 *
 * Safeguards so it helps instead of annoying:
 *  - Appears as a bubble after a short delay (visible even to visitors
 *    who never scroll — bounce-safe), bottom-right, all breakpoints.
 *  - Auto-expands ONCE per browser session into a compact card
 *    ("Need any information?") with Call + WhatsApp actions.
 *  - Dismissing collapses it back to the bubble and stops the
 *    auto-expand for the rest of the session (manual open anytime).
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Phone, X } from "lucide-react";
import { BUSINESS, telLink, waLink } from "@/lib/business";
import { WhatsAppIcon } from "@/components/site/whatsapp-button";

const AUTO_KEY = "clp_contact_card_auto"; // sessionStorage flag

const WA_GREETING =
  "Hi City Line Property! I need some information about a property in Etihad Town, Lahore.";

export function ContactBubble() {
  const [mounted, setMounted] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  // Show the bubble shortly after load (no scroll requirement).
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Auto-expand once per session, after a polite delay.
  useEffect(() => {
    if (!mounted) return;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(AUTO_KEY) === "1";
    } catch {
      /* private mode — treat as not dismissed */
    }
    if (dismissed) return;
    const t = setTimeout(() => {
      // Don't pop while the listing unlock gate is already asking for
      // contact info — two dialogs at once is clutter (skip this session).
      if (document.querySelector('[aria-labelledby="unlock-title"]')) {
        try {
          sessionStorage.setItem(AUTO_KEY, "1");
        } catch {
          /* ignore */
        }
        return;
      }
      setCardOpen(true);
    }, 9000);
    return () => clearTimeout(t);
  }, [mounted]);

  const dismiss = () => {
    setCardOpen(false);
    try {
      sessionStorage.setItem(AUTO_KEY, "1");
    } catch {
      /* private mode — will auto-open again next visit, acceptable */
    }
  };

  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6 print:hidden">
      <AnimatePresence>
        {cardOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            role="dialog"
            aria-label="Contact City Line Property"
            className="w-[288px] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_28px_70px_-18px_rgba(15,23,42,0.5)]"
          >
            {/* Brand strip */}
            <div className="brand-gradient relative px-4 pb-4 pt-3.5 text-white">
              <button
                onClick={dismiss}
                className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/15 hover:text-white"
                aria-label="Close contact popup"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                  <WhatsAppIcon className="h-4 w-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-[13px] font-bold">{BUSINESS.name}</p>
                  <p className="flex items-center gap-1.5 text-[10.5px] font-medium text-white/85">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    </span>
                    Online now — replies in minutes
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-4 pb-4 pt-3.5">
              <p className="text-[14px] font-semibold text-neutral-900">
                Need any information?
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-500">
                Plots, houses, rent or investment — contact us and we&apos;ll
                guide you personally.
              </p>

              <div className="mt-3.5 grid grid-cols-2 gap-2">
                <a
                  href={telLink()}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#0F766E] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.7)] transition-transform hover:scale-[1.03] active:scale-95"
                  aria-label={`Call ${BUSINESS.phonePrimary}`}
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  Call
                </a>
                <a
                  href={waLink(WA_GREETING)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#22C55E] text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(34,197,94,0.7)] transition-transform hover:scale-[1.03] active:scale-95"
                  aria-label="Chat with us on WhatsApp"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" aria-hidden />
                  WhatsApp
                </a>
              </div>

              <p className="mt-2.5 text-center text-[10.5px] font-medium text-neutral-400">
                {BUSINESS.hours}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble — toggles the card */}
      <AnimatePresence>
        {mounted && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            onClick={() => (cardOpen ? dismiss() : setCardOpen(true))}
            className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#22C55E] text-white shadow-[0_12px_30px_-10px_rgba(15,23,42,0.4)] transition-all hover:bg-[#16A34A] active:scale-95"
            aria-label={cardOpen ? "Close contact popup" : "Contact us for any information"}
          >
            {!cardOpen && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-[#22C55E]/50"
              />
            )}
            {cardOpen ? (
              <X className="h-6 w-6" aria-hidden />
            ) : (
              <WhatsAppIcon className="h-6 w-6" aria-hidden />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
