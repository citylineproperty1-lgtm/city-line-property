"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { BUSINESS, AREAS } from "@/lib/business";
import type { Agent } from "@/lib/types";
import {
  ShieldCheck,
  Eye,
  Zap,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Clock,
  BadgePercent,
  Handshake,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export function AboutView() {
  const { navigate } = useAppStore();
  const [agents, setAgents] = useState<(Agent & { listingCount?: number })[]>([]);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents ?? []))
      .catch(() => setAgents([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl bg-[#FAF7EF] px-4 py-10 sm:px-6 sm:py-14">
      {/* Hero */}
      <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
        <p className="text-[13px] font-semibold uppercase tracking-wider text-[#A8851D]">
          About City Line
        </p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
          The 1% office of
          <br />
          <span className="bg-gradient-to-br from-[#DCC059] via-[#C9A227] to-[#8F7018] bg-clip-text text-transparent">
            Etihad Town.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-neutral-500">
          City Line Property is a family-run real estate office at 151-C, Etihad Town
          Phase 1, Lahore. We deal in five societies we know street by street, charge a
          flat 1% commission — and let you deal directly with the owner. No hidden
          margin, no middlemen, no games.
        </p>
      </motion.div>

      {/* Image */}
      <motion.div
        {...fadeUp}
        className="relative mt-12 aspect-[16/8] overflow-hidden rounded-3xl border border-black/[0.06] shadow-[0_30px_80px_-30px_rgba(140,105,25,0.4)]"
      >
        <Image
          src="/images/about-team.jpg"
          alt="The City Line Property team at their Etihad Town Phase 1 office"
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
        />
      </motion.div>

      {/* Stats band */}
      <motion.div
        {...fadeUp}
        className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/[0.07] bg-neutral-200/60 sm:grid-cols-4"
      >
        {[
          { value: "1%", label: "Flat commission — always" },
          { value: `${AREAS.length}`, label: "Areas we deal in" },
          { value: "0", label: "Middlemen & hidden margin" },
          { value: "100%", label: "Direct dealing, in writing" },
        ].map((s) => (
          <div key={s.label} className="bg-white px-6 py-8 text-center">
            <p className="text-2xl font-semibold tracking-tight text-[#8F7018] sm:text-3xl">
              {s.value}
            </p>
            <p className="mt-1.5 text-[13px] font-medium text-neutral-400">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Values */}
      <section className="pt-20">
        <motion.div {...fadeUp} className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#A8851D]">
            What we stand for
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Three values, on every file.
          </h2>
        </motion.div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Honesty",
              text: "If a file has a problem, we tell you before you ask. We'd rather lose a deal than mislead a family — our reputation in Etihad Town is our only marketing.",
            },
            {
              icon: Eye,
              title: "Transparency",
              text: "The owner's price, our 1% fee and every government transfer cost — all on the table in writing, before you commit a single rupee.",
            },
            {
              icon: Zap,
              title: "Speed",
              text: "Site visits within 48 hours, offers presented the same day, transfers pushed through without the usual runaround. Your time is worth money too.",
            },
          ].map((v, i) => (
            <motion.div
              key={v.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.06 }}
              className="rounded-2xl border border-black/[0.07] bg-white p-6 transition-shadow hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#DCBB55] to-[#A8851D] text-white">
                <v.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-neutral-900">
                {v.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-500">{v.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Office card */}
      <section className="pt-20">
        <motion.div
          {...fadeUp}
          className="grid gap-8 rounded-3xl border border-[#C9A227]/25 bg-gradient-to-br from-[#FFFDF5] to-white p-8 shadow-[0_24px_60px_-30px_rgba(140,105,25,0.4)] sm:p-10 lg:grid-cols-[1.2fr_1fr]"
        >
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[#A8851D]">
              Our office
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
              {BUSINESS.officeAddress}
            </h2>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-neutral-500">
              Walk in Mon–Sat, 9 AM to 7 PM — bring your requirement over a cup of chai.
              We&rsquo;re on the main boulevard of Phase 1, two minutes from the main gate.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="h-11 rounded-full gold-gradient px-6 text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(154,123,26,0.7)] hover:opacity-95">
                <a href={`tel:${BUSINESS.telPrimary}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  {BUSINESS.phonePrimary}
                </a>
              </Button>
              <Button
                variant="outline"
                asChild
                className="h-11 rounded-full border-neutral-200 bg-white px-6 text-sm font-semibold"
              >
                <a
                  href="https://maps.google.com/?q=Etihad+Town+Phase+1+Lahore"
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Open in Maps
                </a>
              </Button>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3 rounded-2xl border border-black/[0.06] bg-[#FAF7EF]/70 p-5 text-[13.5px]">
            {[
              { icon: Phone, label: "Phones", value: `${BUSINESS.phonePrimary} · ${BUSINESS.phoneSecondary}` },
              { icon: Mail, label: "Email", value: BUSINESS.email },
              { icon: Clock, label: "Hours", value: BUSINESS.hours },
              { icon: MapPin, label: "Areas", value: AREAS.join(" · ") },
            ].map((r) => (
              <div key={r.label} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#A8851D] shadow-sm">
                  <r.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    {r.label}
                  </p>
                  <p className="break-words font-medium text-neutral-700">{r.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Team */}
      <section className="pt-20">
        <motion.div
          {...fadeUp}
          className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Meet the team
            </h2>
            <p className="mt-2 max-w-md text-sm text-neutral-500">
              Small, senior and specialist — every agent leads their own portfolio and
              answers their own phone.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate({ name: "contact" })}
            className="group h-10 rounded-full text-sm font-medium text-neutral-600 hover:bg-[#C9A227]/10 hover:text-[#8F7018]"
          >
            Work with us
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {agents.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-2xl bg-neutral-100" />
              ))
            : agents.map((a, i) => (
                <motion.button
                  key={a.id}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                  onClick={() => navigate({ name: "agent", id: a.id })}
                  className="group rounded-2xl border border-black/[0.07] bg-white p-6 text-center transition-all hover:-translate-y-0.5 hover:border-[#C9A227]/40 hover:shadow-md"
                  aria-label={`View ${a.name}'s profile and listings`}
                >
                  <span
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white transition-transform group-hover:scale-105"
                    style={{ backgroundColor: a.accent }}
                  >
                    {a.initials}
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-neutral-900 group-hover:text-[#8F7018]">
                    {a.name}
                  </h3>
                  <p className="text-[13px] text-[#A8851D]">{a.title}</p>
                  <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-neutral-500">
                    {a.bio}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 border-t border-neutral-100 pt-4">
                    {a.listingCount !== undefined && (
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11.5px] font-medium text-neutral-600">
                        {a.listingCount} active listing{a.listingCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-3 text-[12.5px] text-neutral-400">
                    <a
                      href={`mailto:${a.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 transition-colors hover:text-neutral-700"
                      aria-label={`Email ${a.name}`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={`tel:${a.phone.replace(/\s/g, "")}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 transition-colors hover:text-neutral-700"
                      aria-label={`Call ${a.name}`}
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-[#A8851D] opacity-0 transition-all group-hover:opacity-100">
                    View profile
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </motion.button>
              ))}
        </div>
      </section>

      {/* Story */}
      <section className="pt-20">
        <motion.div
          {...fadeUp}
          className="grid gap-10 rounded-3xl border border-black/[0.06] bg-white/70 p-8 backdrop-blur sm:p-12 lg:grid-cols-2"
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Our story
            </h2>
            <div className="mt-5 space-y-4 text-[14.5px] leading-relaxed text-neutral-600">
              <p>
                City Line Property opened its doors inside Etihad Town Phase 1 — before
                the boulevards were finished and long before the society became the
                hotspot it is today. We learned every block on foot, one file at a time.
              </p>
              <p>
                Working in Lahore&rsquo;s property market, we kept seeing the same thing:
                families paying two, three, even four percent in commission — plus hidden
                margins stacked into the &ldquo;dealer&rsquo;s price&rdquo;. So we made a decision that
                defines everything we do: <span className="font-semibold text-[#8F7018]">one percent,
                direct dealing, everything in writing.</span>
              </p>
              <p>
                Today we deal in exactly five areas — Etihad Town Phase 1 &amp; 2, Royal
                Enclave, Premier Enclave and the Overseas Block — because we only sell
                where we can vouch for every file. Plots, houses, apartments, commercial
                halls and rentals: one office, one fee, your key to the city.
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            {[
              { year: "Founded", text: "Office opens at 151-C, Etihad Town Phase 1 — first month: two plots, one rental, zero middlemen." },
              { year: "1% model", text: "We cut commission to a flat 1% and put every fee in writing — clients started sending their neighbours." },
              { year: "5 areas", text: "Our coverage settles at the five societies we know best: Etihad Phase 1 & 2, Royal Enclave, Premier Enclave, Overseas Block." },
              { year: "Today", text: "Hundreds of families placed across our five areas — still direct dealing, still 1%, still answering our own phones." },
            ].map((m) => (
              <div key={m.year} className="flex gap-4 rounded-2xl border border-black/[0.06] bg-white p-4">
                <span className="flex h-11 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#DCBB55] to-[#A8851D] px-2 text-center text-[12px] font-bold leading-tight text-white">
                  {m.year}
                </span>
                <p className="self-center text-[13.5px] leading-relaxed text-neutral-600">
                  {m.text}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Promise band */}
      <section className="pb-4 pt-20">
        <motion.div
          {...fadeUp}
          className="grid gap-6 rounded-3xl bg-gradient-to-br from-[#DCBB55] via-[#C9A227] to-[#A8851D] p-8 text-center shadow-[0_30px_70px_-30px_rgba(140,105,25,0.6)] sm:p-10"
        >
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-10">
            <span className="inline-flex items-center gap-2 text-lg font-bold text-[#2E2606]">
              <BadgePercent className="h-6 w-6" />
              Only 1% commission
            </span>
            <span className="hidden h-6 w-px bg-[#8F7018]/30 sm:block" />
            <span className="inline-flex items-center gap-2 text-lg font-bold text-[#2E2606]">
              <Handshake className="h-6 w-6" />
              Direct dealing — no middlemen
            </span>
          </div>
          <p className="mx-auto max-w-xl text-[13.5px] leading-relaxed text-[#4A3C10]">
            {BUSINESS.commissionNote} — confirmed in writing before any deal. That&rsquo;s the
            City Line promise, and it hasn&rsquo;t changed since day one.
          </p>
        </motion.div>
      </section>
    </div>
  );
}
