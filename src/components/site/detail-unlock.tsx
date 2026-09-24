"use client";

/**
 * DetailUnlockGate — the "Option A" soft gate.
 *
 * How it behaves:
 *  - Grid browsing stays 100% free (SEO + bounce safe).
 *  - When a visitor opens a listing's full details, we ask ONCE for
 *    name + phone (no password) to unlock the detail content.
 *  - Declining never blocks: the content unblurs and a slim sticky
 *    "Unlock" pill stays available at the bottom.
 *  - After 2 declines we stop auto-asking (the pill remains).
 *  - Unlock persists in localStorage — a returning visitor is never
 *    asked twice.
 *
 * SEO: the detail content always stays in the DOM (server-rendered);
 * the blur is client-side CSS only, so Googlebot still indexes it.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { categoryLabel, type Property } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/logo";

const UNLOCK_KEY = "clp_unlock";
const DECLINE_KEY = "clp_gate_declines";

type UnlockInfo = { name: string; phone: string; at?: number };

/** Module-level fallback for browsers where localStorage is unavailable. */
let memDeclines = 0;

function readUnlock(): UnlockInfo | null {
  try {
    const raw = localStorage.getItem(UNLOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UnlockInfo;
    if (parsed && typeof parsed.name === "string" && typeof parsed.phone === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function readDeclines(): number {
  try {
    return Number(localStorage.getItem(DECLINE_KEY) ?? "0") || 0;
  } catch {
    return memDeclines;
  }
}

function noteDecline() {
  memDeclines += 1;
  try {
    localStorage.setItem(DECLINE_KEY, String(readDeclines() + 1));
  } catch {
    /* private mode — in-memory counter still softens the gate */
  }
}

export function DetailUnlockGate({
  property,
  children,
}: {
  property: Property;
  children: React.ReactNode;
}) {
  // stage: boot = reading storage, gate = locked, done = unlocked
  const [stage, setStage] = useState<"boot" | "gate" | "done">("boot");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (readUnlock()) {
      setStage("done");
      return;
    }
    setStage("gate");
    // Auto-open the modal on the first couple of listing views only.
    if (readDeclines() < 2) {
      const t = setTimeout(() => setOpen(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  const decline = () => {
    noteDecline();
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Please enter your name.");
      return;
    }
    if (!/^(\+?\d[\d\s-]{7,15})$/.test(phone.trim())) {
      toast.error("Please enter a valid phone number (e.g. 0300 1234567).");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          source: "DETAIL_UNLOCK",
          propertyId: property.id,
          message: `Unlocked full details for "${property.title}" (${property.reference}).`,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error || "Something went wrong. Please try again.");
        return;
      }
      try {
        localStorage.setItem(
          UNLOCK_KEY,
          JSON.stringify({ name: name.trim(), phone: phone.trim(), at: Date.now() })
        );
      } catch {
        /* private mode — unlock for this session only */
      }
      setStage("done");
      setOpen(false);
      toast.success("Details unlocked — happy hunting!");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const locked = stage === "gate";

  return (
    <>
      {/* Gated content — blurred only while the modal is open */}
      <div
        aria-hidden={locked && open}
        className={cn(
          "transition-all duration-300",
          locked && open && "pointer-events-none select-none blur-[6px] saturate-[0.85]"
        )}
      >
        {children}
      </div>

      {/* Sticky unlock pill — only while gated and the modal is closed */}
      <AnimatePresence>
        {locked && !open && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed bottom-4 left-4 z-30 print:hidden"
          >
            <button
              onClick={() => setOpen(true)}
              className="brand-gradient flex items-center gap-2 whitespace-nowrap rounded-full py-3 pl-4 pr-4 text-[13px] font-semibold text-white shadow-[0_14px_34px_-12px_rgba(15,118,110,0.8)] transition-all hover:opacity-95 active:scale-[0.98]"
              aria-label="Unlock full details of this listing"
            >
              <Lock className="h-4 w-4" aria-hidden />
              Unlock full details
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unlock modal */}
      <AnimatePresence>
        {locked && open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center print:hidden"
          >
            {/* Backdrop — click = maybe later (never blocks) */}
            <div
              className="absolute inset-0 bg-neutral-950/45 backdrop-blur-[2px]"
              onClick={decline}
              aria-hidden
            />

            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="unlock-title"
              className="relative w-full max-w-md rounded-3xl border border-black/5 bg-white p-6 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.45)] sm:p-7"
            >
              {/* Close */}
              <button
                onClick={decline}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Maybe later"
              >
                <X className="h-4 w-4" />
              </button>

              <Logo size="sm" />

              <h3
                id="unlock-title"
                className="mt-4 text-xl font-semibold tracking-tight text-neutral-900 sm:text-[22px]"
              >
                Unlock full details
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-500">
                See everything about this listing — complete features, price info
                &amp; contact. It&apos;s free, no password needed.
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#E7F4F0] px-3 py-1 text-[12px] font-semibold text-[#0B6B5D]">
                <MapPin className="h-3 w-3" aria-hidden />
                {categoryLabel(property.type)} · {property.district}
              </div>

              <form onSubmit={submit} noValidate className="mt-5 space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="unlock-name" className="text-[12.5px] font-medium text-neutral-600">
                    Your name
                  </Label>
                  <Input
                    id="unlock-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ahmed Raza"
                    autoComplete="name"
                    className="h-11 rounded-xl border-neutral-200 bg-neutral-50/60 focus-visible:ring-[#0F766E]/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unlock-phone" className="text-[12.5px] font-medium text-neutral-600">
                    Phone number
                  </Label>
                  <Input
                    id="unlock-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03xx xxxxxxx"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className="h-11 rounded-xl border-neutral-200 bg-neutral-50/60 focus-visible:ring-[#0F766E]/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="brand-gradient flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold text-white shadow-[0_12px_28px_-10px_rgba(15,118,110,0.75)] transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Unlocking…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-[18px] w-[18px]" aria-hidden />
                      Unlock details — it&apos;s free
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-neutral-400">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F766E]/70" aria-hidden />
                We only use this to help with your property search — no spam, ever.
                Or just call us on 0309 4499940.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
