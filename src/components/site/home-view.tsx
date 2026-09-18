"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyCard, PropertyCardSkeleton } from "@/components/site/property-card";
import { AnimatedNumber } from "@/components/site/animated-number";
import { AreaMarquee } from "@/components/site/area-marquee";
import { AreaMap } from "@/components/site/area-map";
import { RecentStrip } from "@/components/site/recent-strip";
import { useAppStore } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import {
  PROPERTY_TYPES,
  type Property,
  type TestimonialItem,
  type PlatformStats,
} from "@/lib/types";
import {
  Search,
  MapPin,
  ShieldCheck,
  Handshake,
  LineChart,
  KeyRound,
  Building2,
  Home as HomeIcon,
  Hotel,
  Landmark,
  Warehouse,
  TentTree,
  Star,
  ArrowRight,
  Quote,
  Sparkles,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const CATEGORY_ICONS = [HomeIcon, Hotel, Landmark, Building2, Warehouse, KeyRound, TentTree];

export function HomeView() {
  const { navigate, setFilters } = useAppStore();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  // hero search state
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  useEffect(() => {
    fetch("/api/properties?featured=true&limit=6")
      .then((r) => r.json())
      .then((d) => setFeatured(d.properties ?? []))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));

    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((d) => setTestimonials(d.testimonials ?? []))
      .catch(() => setTestimonials([]));

    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.stats))
      .catch(() => setStats(null));
  }, []);

  const heroSearch = () => {
    setFilters({
      search: q,
      type,
      status,
      beds: 0,
      minPrice: null,
      maxPrice: null,
      sort: "newest",
    });
    navigate({ name: "properties" });
  };

  const browseType = (t: string) => {
    setFilters({ type: t, search: "", status: "ALL", beds: 0, minPrice: null, maxPrice: null });
    navigate({ name: "properties" });
  };

  const cheapest = featured.length
    ? featured.reduce((a, b) => (a.price < b.price ? a : b))
    : null;

  return (
    <div className="flex flex-col">
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden">
        <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-neutral-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Karachi&rsquo;s trusted property partner since 2011
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-neutral-900 sm:text-6xl">
              Find a place you&rsquo;ll
              <br />
              <span className="text-neutral-400">love to live.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-neutral-500 sm:text-base">
              Handpicked homes, villas and workspaces across the city&rsquo;s finest
              neighbourhoods — with transparent pricing and agents who actually pick up the phone.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="mx-auto mt-9 max-w-2xl"
          >
            <div className="flex flex-col gap-2 rounded-3xl border border-neutral-200 bg-white p-2.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.18)] sm:flex-row sm:items-center sm:rounded-full sm:p-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && heroSearch()}
                  placeholder="Search DHA, Clifton, PECHS…"
                  className="h-11 rounded-full border-0 bg-transparent pl-11 text-[15px] shadow-none focus-visible:ring-0 sm:h-10"
                  aria-label="Search properties"
                />
              </div>
              <div className="flex gap-2 px-2.5 sm:px-0">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-11 flex-1 rounded-full border-neutral-200 bg-neutral-50 text-[13px] focus:ring-0 sm:w-[120px] sm:flex-none sm:h-10">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Any type</SelectItem>
                    {PROPERTY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-11 flex-1 rounded-full border-neutral-200 bg-neutral-50 text-[13px] focus:ring-0 sm:w-[115px] sm:flex-none sm:h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Buy or rent</SelectItem>
                    <SelectItem value="SALE">For sale</SelectItem>
                    <SelectItem value="RENT">For rent</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={heroSearch}
                  className="h-11 flex-1 rounded-full bg-neutral-900 px-6 text-sm font-medium hover:bg-neutral-700 sm:h-10 sm:flex-none"
                >
                  Search
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[12.5px] text-neutral-400">
              <span className="mr-1">Popular:</span>
              {["DHA Phase 6", "Clifton", "PECHS", "Bahria Town"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setFilters({ search: tag, status: "ALL", type: "ALL", beds: 0, minPrice: null, maxPrice: null });
                    navigate({ name: "properties" });
                  }}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1 font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            className="relative mx-auto mt-12 max-w-5xl"
          >
            <div className="relative aspect-[16/8.5] overflow-hidden rounded-3xl border border-neutral-200/70 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]">
              <Image
                src="/images/hero.jpg"
                alt="Modern minimalist home — City Line Property featured listing"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            </div>
            {/* Floating price card */}
            {cheapest && (
              <motion.button
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => navigate({ name: "property", id: cheapest.id })}
                className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white/95 p-3 pr-5 text-left shadow-xl backdrop-blur sm:left-8"
              >
                <span className="relative h-11 w-11 overflow-hidden rounded-xl bg-neutral-100">
                  <Image src={cheapest.images[0]} alt="" fill sizes="44px" className="object-cover" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[11px] font-medium text-emerald-600">Featured deal</span>
                  <span className="text-sm font-semibold tracking-tight text-neutral-900">
                    {formatPKR(cheapest.price, cheapest.status === "RENT")}
                  </span>
                </span>
                <ArrowRight className="ml-2 h-4 w-4 text-neutral-300" />
              </motion.button>
            )}
          </motion.div>
        </div>
      </section>

      <AreaMarquee />

      {/* ---------- STATS ---------- */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6">
        <motion.div
          {...fadeUp}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-200/60 sm:grid-cols-4"
        >
          {[
            { label: "Live listings", value: stats?.properties ?? null, suffix: "" },
            { label: "For sale", value: stats?.forSale ?? null, suffix: "" },
            { label: "For rent", value: stats?.forRent ?? null, suffix: "" },
            { label: "Expert agents", value: stats?.agents ?? null, suffix: "" },
          ].map((s) => (
            <div key={s.label} className="bg-white px-6 py-7 text-center">
              <p className="text-3xl font-semibold tracking-tight text-neutral-900">
                <AnimatedNumber value={s.value} />
                <span className="text-emerald-600">+</span>
              </p>
              <p className="mt-1 text-[13px] font-medium text-neutral-400">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ---------- FEATURED ---------- */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-6">
        <motion.div {...fadeUp} className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-emerald-600">
              Handpicked
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Featured properties
            </h2>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate({ name: "properties" })}
            className="group hidden h-10 items-center gap-1.5 rounded-full text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 sm:inline-flex"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </motion.div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <PropertyCardSkeleton key={i} />)
            : featured.slice(0, 6).map((p, i) => <PropertyCard key={p.id} property={p} index={i} />)}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button
            variant="outline"
            onClick={() => navigate({ name: "properties" })}
            className="h-11 rounded-full border-neutral-200 text-sm font-medium"
          >
            View all properties
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ---------- EXPLORE BY AREA (interactive map) ---------- */}
      <AreaMap />

      {/* ---------- CATEGORIES ---------- */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-6">
        <motion.div {...fadeUp} className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-emerald-600">Browse</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            What are you looking for?
          </h2>
        </motion.div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {PROPERTY_TYPES.map((t, i) => {
            const Icon = CATEGORY_ICONS[i % CATEGORY_ICONS.length];
            return (
              <motion.button
                key={t.value}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.04 }}
                onClick={() => browseType(t.value)}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white px-3 py-6 transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 transition-colors group-hover:bg-neutral-900 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[13px] font-medium text-neutral-700 group-hover:text-neutral-900">
                  {t.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ---------- SERVICES ---------- */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-6">
        <motion.div {...fadeUp} className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-emerald-600">Services</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Every step, covered.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-neutral-500">
            From first viewing to final handover — one team, one point of contact, zero surprises.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: KeyRound,
              title: "Buy a home",
              text: "Curated shortlists, honest pricing advice and full legal verification before you commit.",
            },
            {
              icon: Handshake,
              title: "Sell with us",
              text: "Professional photography, targeted marketing and an average of 3 qualified offers in 3 weeks.",
            },
            {
              icon: Building2,
              title: "Rent with ease",
              text: "Verified tenants and landlords, transparent contracts and maintenance that actually responds.",
            },
            {
              icon: LineChart,
              title: "Invest & manage",
              text: "Yield analysis, portfolio management and end-to-end rental administration for owners.",
            },
          ].map((s, i) => (
            <motion.div
              key={s.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.06 }}
              className="group rounded-2xl border border-neutral-200/80 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-neutral-900">{s.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-500">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- WHY US ---------- */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-6">
        <motion.div
          {...fadeUp}
          className="grid items-center gap-10 rounded-3xl border border-neutral-200/80 bg-neutral-50/60 p-8 sm:p-12 lg:grid-cols-2"
        >
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-emerald-600">Why City Line</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Property, minus the headaches.
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                {
                  icon: ShieldCheck,
                  title: "Verified listings only",
                  text: "Every property is physically inspected and ownership-verified before it goes live.",
                },
                {
                  icon: LineChart,
                  title: "Real market data",
                  text: "We publish actual transaction insights, so your offer is grounded in evidence — not guesswork.",
                },
                {
                  icon: Handshake,
                  title: "One dedicated agent",
                  text: "A single point of contact from first call to key handover. No call-centre runaround.",
                },
              ].map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-neutral-200/70">
                    <f.icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-neutral-900">{f.title}</p>
                    <p className="mt-0.5 text-[13.5px] leading-relaxed text-neutral-500">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200/70 shadow-lg">
            <Image
              src="/images/about-team.jpg"
              alt="City Line Property consultants in their Karachi office"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </motion.div>
      </section>

      {/* ---------- TESTIMONIALS ---------- */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-6">
        <motion.div {...fadeUp} className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-emerald-600">
            Testimonials
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            People who found their place.
          </h2>
        </motion.div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(testimonials.length
            ? testimonials
            : Array.from({ length: 4 }).map(() => null)
          ).map((t, i) =>
            t === null ? (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-neutral-100" />
            ) : (
              <motion.figure
                key={t.id}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                className="flex flex-col rounded-2xl border border-neutral-200/80 bg-white p-6"
              >
                <Quote className="h-5 w-5 text-emerald-600/60" />
                <blockquote className="mt-3 flex-1 text-[13.5px] leading-relaxed text-neutral-600">
                  {t.content}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-neutral-100 pt-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
                    {t.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-neutral-900">{t.name}</p>
                    <p className="truncate text-[12px] text-neutral-400">{t.role}</p>
                  </div>
                  <span className="ml-auto flex gap-0.5" aria-label={`${t.rating} star rating`}>
                    {Array.from({ length: t.rating }).map((_, s) => (
                      <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </span>
                </figcaption>
              </motion.figure>
            )
          )}
        </div>
      </section>

      <RecentStrip />

      {/* ---------- CTA ---------- */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-4 pt-20 sm:px-6">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-3xl bg-neutral-900 px-8 py-14 text-center sm:py-20"
        >
          <Image
            src="/images/cta-bg.jpg"
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 via-neutral-900/40 to-neutral-900/80" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to make your next move?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-neutral-300">
              Tell us what you&rsquo;re looking for — a free, no-pressure consultation
              with a senior agent takes 20 minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                onClick={() => navigate({ name: "properties" })}
                className="h-12 rounded-full bg-white px-7 text-sm font-semibold text-neutral-900 hover:bg-neutral-200"
              >
                Browse properties
              </Button>
              <Button
                onClick={() => navigate({ name: "contact" })}
                variant="outline"
                className="h-12 rounded-full border-white/30 bg-white/10 px-7 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 hover:text-white"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Talk to an agent
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
