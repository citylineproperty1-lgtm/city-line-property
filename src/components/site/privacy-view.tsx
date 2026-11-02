"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { BUSINESS, telLink } from "@/lib/business";
import {
  Clock,
  Cookie,
  Database,
  Eye,
  Handshake,
  Mail,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const SECTIONS = [
  {
    icon: Database,
    title: "What we collect",
    items: [
      "Details you send us — name, phone number, email and your message when you submit an inquiry, requirement or price-list form.",
      "Site usage data (which pages and listings are viewed, which buttons are clicked) — but only after you press \u201CAccept all\u201D in the cookie banner.",
      "Browser-local data: your saved listings, recently viewed listings, theme and cookie choice are stored in your own browser only and never leave your device.",
    ],
  },
  {
    icon: Cookie,
    title: "Cookies & local storage",
    items: [
      "clp-cookie-consent — remembers your Decline / Accept choice so we stop asking.",
      "city-line-property — your saved and recently viewed listings (stays in your browser).",
      "theme — your light / dark preference.",
      "Google Analytics cookies (_ga, _ga_*) — set only after you accept. Decline means they are never created.",
    ],
  },
  {
    icon: Eye,
    title: "Google Analytics",
    items: [
      "Analytics is off by default. The Google Analytics script is not even downloaded until you press \u201CAccept all\u201D.",
      "We see aggregated numbers only — page views, popular listings, button clicks. No names, no phone numbers, no cross-site profiling.",
      "You can withdraw anytime: clear this site\u2019s data in your browser settings and choose \u201CDecline\u201D on your next visit.",
    ],
  },
  {
    icon: Handshake,
    title: "How we use your information",
    items: [
      "Reply to your inquiries and arrange site visits.",
      "Send the listing details, price lists or files you asked for (call / WhatsApp / email).",
      "Improve the website — understand which listings and areas matter most to visitors.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Sharing",
    items: [
      "We never sell your data. Ever.",
      "Google receives anonymous usage statistics — and only if you accepted analytics.",
      "When you tap a WhatsApp or call button, the message or call is handled by WhatsApp / your phone app — their own privacy policies apply.",
    ],
  },
  {
    icon: Settings,
    title: "Your choices",
    items: [
      "Press \u201CDecline\u201D in the cookie banner and analytics stays completely off.",
      "Changed your mind? Clear this site\u2019s data in your browser — the banner will come back on your next visit.",
      "Want your inquiry details removed? Call or WhatsApp us and we will delete them.",
    ],
  },
] as const;

export function PrivacyView() {
  const { navigate } = useAppStore();

  return (
    <div className="bg-mesh mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Hero */}
      <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-foreground">
          Privacy
        </p>
        <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
          Your privacy,{" "}
          <span className="text-brand-gradient">kept simple.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Plain English, no legal fog: what City Line Property collects, what
          stays in your own browser, and how analytics only works if you say
          yes.
        </p>
        <p className="mt-3 text-[12.5px] text-muted-foreground/80">
          Last updated: November 2026
        </p>
      </motion.div>

      {/* Sections */}
      <div className="mt-12 grid gap-4 sm:gap-5 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <motion.section
            key={s.title}
            {...fadeUp}
            className="rounded-2xl border border-border bg-card p-5 sm:p-6"
            aria-labelledby={`privacy-${s.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
          >
            <div className="flex items-center gap-3">
              <div
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E] ring-1 ring-[#0F766E]/25 dark:text-[#2DD4BF]"
              >
                <s.icon className="h-5 w-5" />
              </div>
              <h2
                id={`privacy-${s.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                className="text-[16.5px] font-semibold tracking-tight text-foreground"
              >
                {s.title}
              </h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {s.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-2.5 text-[13.5px] leading-relaxed text-muted-foreground"
                >
                  <span
                    aria-hidden
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0F766E]/60 dark:bg-[#2DD4BF]/70"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        ))}
      </div>

      {/* Contact strip */}
      <motion.div
        {...fadeUp}
        className="bg-mesh-dark gradient-border-dark mt-12 overflow-hidden rounded-3xl p-6 text-white sm:p-8"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Questions about your data?
            </h2>
            <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-white/70">
              Call, WhatsApp or visit the office — we will answer in plain
              language and delete anything you ask us to delete.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-[#2DD4BF]" aria-hidden />
              <span>{BUSINESS.officeAddress}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-[#2DD4BF]" aria-hidden />
              <a href={telLink()} className="font-medium transition-colors hover:text-[#5EB9A9]">
                {BUSINESS.phonePrimary}
              </a>
              <span aria-hidden className="text-white/30">·</span>
              <a
                href={telLink(BUSINESS.telSecondary)}
                className="font-medium transition-colors hover:text-[#5EB9A9]"
              >
                {BUSINESS.phoneSecondary}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-[#2DD4BF]" aria-hidden />
              <a
                href={`mailto:${BUSINESS.email}`}
                className="font-medium transition-colors hover:text-[#5EB9A9]"
              >
                {BUSINESS.email}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 shrink-0 text-[#2DD4BF]" aria-hidden />
              <span>{BUSINESS.hours}</span>
            </li>
          </ul>
        </div>
      </motion.div>

      {/* Back to safety */}
      <div className="mt-8 text-center">
        <button
          onClick={() => navigate({ name: "home" })}
          className="rounded-full border border-[#0F766E]/40 bg-[#0F766E]/10 px-5 py-2.5 text-[13px] font-semibold text-[#0F766E] transition-colors hover:bg-[#0F766E]/20 dark:text-[#5EB9A9]"
        >
          Back to the homepage
        </button>
      </div>
    </div>
  );
}
