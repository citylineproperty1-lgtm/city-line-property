"use client";

/**
 * Area guides — editorial pages for the five societies we cover.
 * Index (#/areas): five cover cards with live stats.
 * Detail (#/areas/<slug>): hero, story, highlights, live listings, nearby areas.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  CheckCircle2,
  Building2,
  Loader2,
  MapPin,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Property } from "@/lib/types";
import { AREA_GUIDES, areaBySlug, type AreaGuide } from "@/lib/areas";
import { AREA_SHORT, BUSINESS, waLink } from "@/lib/business";
import { PropertyCard } from "@/components/site/property-card";

interface DistrictStat {
  district: string;
  count: number;
  saleAvg: number;
  rentAvg: number;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
} as const;

/** Live per-area numbers computed client-side from the public listings API. */
function useDistrictStats(): DistrictStat[] | null {
  const [stats, setStats] = useState<DistrictStat[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/properties?limit=300")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const list: Property[] = d.properties ?? [];
        const acc = new Map<string, { count: number; saleSum: number; saleN: number; rentSum: number; rentN: number }>();
        for (const p of list) {
          const row = acc.get(p.district) ?? { count: 0, saleSum: 0, saleN: 0, rentSum: 0, rentN: 0 };
          row.count++;
          if (p.status === "SALE") {
            row.saleSum += p.price;
            row.saleN++;
          } else {
            row.rentSum += p.price;
            row.rentN++;
          }
          acc.set(p.district, row);
        }
        const out: DistrictStat[] = [...acc.entries()].map(([district, r]) => ({
          district,
          count: r.count,
          saleAvg: r.saleN ? Math.round(r.saleSum / r.saleN) : 0,
          rentAvg: r.rentN ? Math.round(r.rentSum / r.rentN) : 0,
        }));
        setStats(out);
      })
      .catch(() => {
        if (alive) setStats([]);
      });
    return () => {
      alive = false;
    };
  }, []);
  return stats;
}

function statFor(stats: DistrictStat[] | null, name: string): DistrictStat {
  return (
    stats?.find((s) => s.district === name) ?? { district: name, count: 0, saleAvg: 0, rentAvg: 0 }
  );
}

/** Tight price label for stat tiles: "PKR 1.6 Cr" / "PKR 1.9 L/mo". */
function compactPKR(v: number, perMonth = false): string {
  const base = formatPKR(v, perMonth).replace(" Crore", " Cr").replace(" Lakh", " L");
  return base;
}

/* ------------------------------- Index view ------------------------------ */

export function AreasIndexView() {
  const { navigate } = useAppStore();
  const stats = useDistrictStats();

  return (
    <div className="mx-auto max-w-6xl bg-background px-4 py-10 sm:px-6 sm:py-14">
      {/* Header */}
      <motion.header {...fadeUp} transition={{ duration: 0.4, ease: "easeOut" }}>
        <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0B6B5D]">
          <MapPin className="h-4 w-4" />
          Area guides
        </p>
        <h1 className="mt-3 max-w-xl text-3xl font-bold leading-[1.1] tracking-tight text-neutral-900 sm:text-[44px]">
          Five areas. <span className="text-brand-gradient">Known street by street.</span>
        </h1>
        <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-neutral-500">
          We only deal where we can vouch for every file — the Etihad Town pocket
          and its neighbouring enclaves in Lahore. Here is what each one is really
          like, straight from the desk that works there every day.
        </p>
      </motion.header>

      {/* Area cards */}
      <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {AREA_GUIDES.map((area, i) => {
          const stat = statFor(stats, area.name);
          return (
            <motion.article
              key={area.slug}
              {...fadeUp}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 + i * 0.06 }}
              className={cn(
                "group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_48px_-18px_rgba(15,23,42,0.22)]",
                i === 0 && "sm:col-span-2 lg:col-span-1"
              )}
              onClick={() => navigate({ name: "area", slug: area.slug })}
              role="link"
              tabIndex={0}
              aria-label={`Open the ${area.name} area guide`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate({ name: "area", slug: area.slug });
                }
              }}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                <Image
                  src={area.cover}
                  alt={area.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" aria-hidden />
                {area.office && (
                  <span className="brand-gradient absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-white shadow-sm">
                    <Star className="h-3 w-3" />
                    Our office here
                  </span>
                )}
                <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-2">
                  <h2 className="text-[19px] font-bold leading-tight tracking-tight text-white drop-shadow-sm">
                    {area.name}
                  </h2>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#0B6B5D] opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="text-[13px] font-medium leading-relaxed text-neutral-500">
                  {area.tagline}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#F7F9F8] p-3 text-center">
                  <div>
                    <p className="text-[15px] font-bold tabular-nums text-neutral-900">{stat.count}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">Listings</p>
                  </div>
                  <div className="border-x border-black/[0.06]">
                    <p className="text-[15px] font-bold tabular-nums text-neutral-900">
                      {stat.saleAvg > 0 ? compactPKR(stat.saleAvg) : "—"}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">Avg. sale</p>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold tabular-nums text-neutral-900">
                      {stat.rentAvg > 0 ? compactPKR(stat.rentAvg, true) : "—"}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">Avg. rent</p>
                  </div>
                </div>
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {area.goodFor.map((g) => (
                    <span
                      key={g}
                      className="rounded-full border border-[#0F766E]/20 bg-[#E7F4F0]/70 px-2.5 py-1 text-[10.5px] font-semibold text-[#0B6B5D]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[12.5px] font-semibold text-[#0B6B5D]">
                  Read the area guide
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </motion.article>
          );
        })}

        {/* Office card fills the 6th grid slot */}
        <motion.aside
          {...fadeUp}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
          className="flex flex-col justify-between overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0F766E_0%,#0B5B54_55%,#084C46_100%)] p-6 shadow-[0_24px_60px_-30px_rgba(15,118,110,0.7)] sm:col-span-2 lg:col-span-1"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-white">
              <BadgePercent className="h-3 w-3" />
              Only 1% commission
            </span>
            <h2 className="mt-4 text-[21px] font-bold leading-snug tracking-tight text-white">
              Not sure which area fits you?
            </h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/85">
              Walk into our office at {BUSINESS.officeAddress} — we will shortlist
              honest options across all five areas for your budget. Direct dealing,
              no middlemen, flat 1%.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button
              onClick={() => navigate({ name: "contact" })}
              className="rounded-full bg-white px-5 text-[13px] font-semibold text-[#0B6B5D] hover:bg-white/90"
            >
              Post a requirement
            </Button>
            <a
              href={waLink(`Hi City Line Property! I'd like advice on picking between the five Etihad Town areas.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center rounded-full border border-white/50 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-white/15"
            >
              WhatsApp us
            </a>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

/* ------------------------------ Detail view ------------------------------ */

export function AreaDetailView({ slug }: { slug: string }) {
  const { navigate, setFilters } = useAppStore();
  const area = areaBySlug(slug);
  const stats = useDistrictStats();
  const [listings, setListings] = useState<{ key: string; items: Property[] } | null>(null);

  useEffect(() => {
    if (!area) return;
    let alive = true;
    const key = area.name;
    fetch(`/api/properties?district=${encodeURIComponent(area.name)}&limit=6`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setListings({ key, items: d.properties ?? [] });
      })
      .catch(() => {
        if (alive) setListings({ key, items: [] });
      });
    return () => {
      alive = false;
    };
  }, [area]);

  // Unknown slug → friendly not-found.
  if (!area) {
    return (
      <div className="mx-auto max-w-3xl bg-background px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-10 text-center">
          <MapPin className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-3 text-[14px] text-neutral-500">That area guide doesn&rsquo;t exist.</p>
          <Button
            onClick={() => navigate({ name: "areas" })}
            className={`brand-gradient mt-5 rounded-full px-5 text-white shadow-[0_8px_22px_-8px_rgba(15,118,110,0.65)] hover:opacity-95`}
          >
            All areas
          </Button>
        </div>
      </div>
    );
  }

  const stat = statFor(stats, area.name);
  const loading = !listings || listings.key !== area.name;
  const others = AREA_GUIDES.filter((a) => a.slug !== area.slug);

  const browseArea = () => {
    // district-focused search: keep the area in the toolbar search box for context
    setFilters({
      search: area.name,
      status: "ALL",
      type: "ALL",
      beds: 0,
      minPrice: null,
      maxPrice: null,
      sort: "newest",
    });
    navigate({ name: "properties" });
  };

  return (
    <div className="mx-auto max-w-6xl bg-background px-4 py-10 sm:px-6 sm:py-14">
      <button
        onClick={() => navigate({ name: "areas" })}
        className="group mb-8 inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white px-4 py-2 text-[13px] font-medium text-neutral-600 transition-all hover:border-[#0F766E]/40 hover:text-[#0B6B5D]"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        All areas
      </button>

      {/* Hero */}
      <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_1fr]">
        <motion.div {...fadeUp} transition={{ duration: 0.45, ease: "easeOut" }}>
          <p className="flex flex-wrap items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0B6B5D]">
            <MapPin className="h-4 w-4" />
            Area guide · Etihad Town, Lahore
            {area.office && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F4F0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#0B6B5D] ring-1 ring-[#0F766E]/25">
                <Star className="h-3 w-3" />
                Our office here
              </span>
            )}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-[1.08] tracking-tight text-neutral-900 sm:text-[42px]">
            {area.name}
          </h1>
          <p className="mt-3 text-[16px] font-medium text-[#0B6B5D]">{area.tagline}</p>

          {/* Live stat pills */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[12.5px] font-semibold text-neutral-700 shadow-sm">
              <Building2 className="h-3.5 w-3.5 text-[#0F766E]" />
              {stat.count} live {stat.count === 1 ? "listing" : "listings"}
            </span>
            {stat.saleAvg > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[12.5px] font-semibold text-neutral-700 shadow-sm">
                <TrendingUp className="h-3.5 w-3.5 text-[#0F766E]" />
                Avg. sale {formatPKR(stat.saleAvg)}
              </span>
            )}
            {stat.rentAvg > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[12.5px] font-semibold text-neutral-700 shadow-sm">
                <TrendingUp className="h-3.5 w-3.5 text-[#0F766E]" />
                Avg. rent {formatPKR(stat.rentAvg, true)}
              </span>
            )}
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Button
              onClick={browseArea}
              className="brand-gradient h-11 rounded-full px-5 text-[13.5px] font-semibold text-white shadow-[0_8px_22px_-8px_rgba(15,118,110,0.65)] hover:opacity-95"
            >
              Browse {stat.count > 0 ? `${stat.count} ` : ""}listings in {AREA_SHORT[area.name] ?? area.name}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <a
              href={waLink(
                `Hi City Line Property! I'm interested in ${area.name}. Please share available options.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center rounded-full border border-neutral-300 bg-white px-5 text-[13.5px] font-semibold text-neutral-700 transition-colors hover:border-[#0F766E]/50 hover:text-[#0B6B5D]"
            >
              Ask about this area
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
          className="relative aspect-[16/11] overflow-hidden rounded-3xl border border-white/70 shadow-[0_28px_70px_-30px_rgba(15,23,42,0.4)]"
        >
          <Image
            src={area.cover}
            alt={area.name}
            fill
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-cover"
            priority
          />
        </motion.div>
      </div>

      {/* Story + highlights */}
      <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <motion.section {...fadeUp} transition={{ duration: 0.45, delay: 0.05 }} className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            The honest picture
          </h2>
          {area.about.map((p, i) => (
            <p key={i} className="mt-4 text-[14.5px] leading-[1.8] text-neutral-600 first:mt-4">
              {p}
            </p>
          ))}
          <div className="mt-6 flex flex-wrap gap-1.5">
            {area.goodFor.map((g) => (
              <span
                key={g}
                className="rounded-full border border-[#0F766E]/20 bg-[#E7F4F0]/70 px-3 py-1.5 text-[11.5px] font-semibold text-[#0B6B5D]"
              >
                Good for {g.toLowerCase()}
              </span>
            ))}
          </div>
        </motion.section>

        <motion.section {...fadeUp} transition={{ duration: 0.45, delay: 0.1 }} className="rounded-3xl border border-[#0F766E]/20 bg-[linear-gradient(135deg,rgba(231,244,240,0.9),rgba(231,244,240,0.45))] p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            Why buyers pick it
          </h2>
          <ul className="mt-5 space-y-3.5">
            {area.highlights.map((h, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.15 + i * 0.08 }}
                className="flex items-start gap-3 text-[13.5px] leading-relaxed text-neutral-700"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" />
                {h}
              </motion.li>
            ))}
          </ul>
        </motion.section>
      </div>

      {/* Live listings */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0B6B5D]">
              Live on the market
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
              Current listings in {area.name}
            </h2>
          </div>
          <button
            onClick={browseArea}
            className="group inline-flex items-center gap-1.5 rounded-full border border-[#0F766E]/25 bg-[#E7F4F0]/70 px-4 py-2 text-[12.5px] font-semibold text-[#0B6B5D] transition-all hover:border-[#0F766E]/50 hover:bg-[#E7F4F0]"
          >
            Browse all in {area.name}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {loading ? (
          <div className="mt-6 flex min-h-40 items-center justify-center rounded-3xl border border-neutral-200/70 bg-white">
            <Loader2 className="h-5 w-5 animate-spin text-[#0F766E]" />
          </div>
        ) : listings.items.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-neutral-200/80 bg-white p-10 text-center">
            <Building2 className="mx-auto h-8 w-8 text-neutral-300" />
            <p className="mt-3 text-[14px] font-semibold text-neutral-700">
              No published listings in this area right now
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-neutral-400">
              Good files here usually move before they reach the site — WhatsApp
              the office and we will send what is coming up.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.items.slice(0, 6).map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Nearby areas */}
      <section className="mt-14" aria-label="Other areas">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
          Explore the other areas
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((a, i) => {
            const s = statFor(stats, a.name);
            return (
              <motion.button
                key={a.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                onClick={() => {
                  navigate({ name: "area", slug: a.slug });
                  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
                }}
                className="group flex items-center gap-3.5 rounded-2xl border border-neutral-200/80 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#0F766E]/35 hover:shadow-[0_12px_32px_-16px_rgba(15,118,110,0.45)]"
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                  <Image src={a.cover} alt="" fill sizes="48px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-neutral-900 transition-colors group-hover:text-[#0B6B5D]">
                    {a.name}
                  </span>
                  <span className="block text-[11.5px] text-neutral-400">
                    {s.count} {s.count === 1 ? "listing" : "listings"}
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-[#0F766E]" />
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
