"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, FileDown, ListChecks, Loader2, MapPinned, ShieldCheck } from "lucide-react";
import { AREAS } from "@/lib/business";

/**
 * Lead magnet — "Get the Etihad Town price list on WhatsApp".
 * Captures name + phone as a CRM lead (source PRICE_LIST) and then hands the
 * visitor a wa.me deep link pre-filled with the same request, so the office
 * gets the lead twice: once in the admin inbox, once in WhatsApp.
 */
export function PriceListLead() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const n = name.trim();
    const p = phone.trim();
    if (n.length < 2) {
      toast.error("Please enter your name.");
      return;
    }
    if (!/^(\+?\d[\d\s-]{7,15})$/.test(p)) {
      toast.error("Please enter a valid phone number (e.g. 0300 1234567).");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: n,
          phone: p,
          message: "Please send me the latest Etihad Town price list.",
          source: "PRICE_LIST",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      setName("");
      setPhone("");
      toast.success("Done! The price list is on its way — opening WhatsApp…");
      // Hand the visitor to WhatsApp with the same request pre-filled.
      if (data?.waLink && typeof window !== "undefined") {
        window.open(data.waLink, "_blank", "noopener,noreferrer");
      }
    } catch {
      toast.error("Network problem — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20"
      aria-label="Get the Etihad Town price list on WhatsApp"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0F766E_0%,#0B5B54_55%,#08443F_100%)] shadow-[0_36px_90px_-36px_rgba(8,68,63,0.65)]"
      >
        {/* decorative rings */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[26px] border-white/[0.06]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full border-[34px] border-white/[0.05]"
        />

        <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          {/* Copy */}
          <div className="text-white">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C7EAE2] backdrop-blur">
              <FileDown className="h-3.5 w-3.5" />
              Free · No obligation
            </p>
            <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-tight sm:text-[2rem]">
              Get today&rsquo;s Etihad Town price list — straight on WhatsApp.
            </h2>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/75">
              Current rates for plots, houses and apartments across{" "}
              {AREAS.join(", ")}. One message from our office, the same day you ask.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                { icon: ListChecks, text: "Live rates, updated by our own field team" },
                { icon: MapPinned, text: "All five societies — Phase 1, Phase 2 & the enclaves" },
                { icon: ShieldCheck, text: "No spam, no call centre — only our office messages you" },
              ].map((r) => (
                <li key={r.text} className="flex items-start gap-2.5 text-[13.5px] font-medium text-white/90">
                  <span className="mt-0.5 flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <r.icon className="h-3.5 w-3.5" />
                  </span>
                  {r.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Form card */}
          <div className="rounded-3xl border border-white/50 bg-white p-6 shadow-[0_24px_60px_-24px_rgba(4,26,23,0.5)] sm:p-7">
            {done ? (
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F4F0]">
                  <CheckCircle2 className="h-7 w-7 text-[#0F766E]" />
                </span>
                <p className="mt-4 text-lg font-semibold tracking-tight text-neutral-900">
                  Request received!
                </p>
                <p className="mt-1.5 max-w-[260px] text-[13.5px] leading-relaxed text-neutral-500">
                  We&rsquo;ve saved your number — the latest price list will reach your
                  WhatsApp within working hours.
                </p>
                <button
                  onClick={() => setDone(false)}
                  className="mt-5 text-[13px] font-semibold text-[#0B6B5D] underline decoration-[#0F766E]/30 underline-offset-4 transition-colors hover:decoration-[#0F766E]"
                >
                  Request for someone else
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="flex h-full flex-col">
                <h3 className="text-[17px] font-semibold tracking-tight text-neutral-900">
                  Where should we send it?
                </h3>
                <p className="mt-1 text-[12.5px] text-neutral-400">
                  Takes 10 seconds — we call only if you ask us to.
                </p>

                <div className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pl-name" className="text-[13px] text-neutral-600">
                      Your name
                    </Label>
                    <Input
                      id="pl-name"
                      required
                      minLength={2}
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ali Hassan"
                      className="h-11 rounded-xl border-neutral-200 bg-neutral-50/60 focus-visible:ring-[#0F766E]/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pl-phone" className="text-[13px] text-neutral-600">
                      WhatsApp number
                    </Label>
                    <Input
                      id="pl-phone"
                      required
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="03xx xxxxxxx"
                      className="h-11 rounded-xl border-neutral-200 bg-neutral-50/60 focus-visible:ring-[#0F766E]/30"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={busy}
                  className="brand-gradient mt-5 h-12 w-full rounded-full text-[14.5px] font-semibold text-white shadow-[0_10px_26px_-10px_rgba(15,118,110,0.75)] hover:opacity-95 disabled:opacity-70"
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="mr-2 h-4 w-4" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                      </svg>
                      Send me the price list
                    </>
                  )}
                </Button>
                <p className="mt-3 text-center text-[11.5px] leading-relaxed text-neutral-400">
                  By continuing you agree to be contacted about property in Etihad
                  Town. Your number is never shared with anyone else.
                </p>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
