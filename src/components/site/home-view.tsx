"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useScroll, useSpring, useTransform, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyCard, PropertyCardSkeleton } from "@/components/site/property-card";
import { AnimatedNumber } from "@/components/site/animated-number";
import { Monogram } from "@/components/site/logo";
import RealMap, { type MapMarker } from "@/components/site/real-map";
import { RequirementForm } from "@/components/site/requirement-form";
import { PriceListLead } from "@/components/site/price-list-lead";
import { useAppStore } from "@/lib/store";
import { AREAS, AREA_COORDS, BUSINESS, OFFICE_COORD, waLink } from "@/lib/business";
import { areaSlug, areaBySlug } from "@/lib/areas";
import {
  CATEGORIES,
  type CategoryDef,
  type PlatformStats,
  type Property,
} from "@/lib/types";
import {
  Search,
  MapPin,
  BadgePercent,
  Handshake,
  FileCheck2,
  MessageSquareText,
  ClipboardList,
  Scale,
  KeyRound,
  ChevronDown,
  Star,
  Quote,
  Check,
  Clock,
  Phone,
  MessageCircle,
  LandPlot,
  Store,
  Home as HomeIcon,
  Building2,
  Warehouse,
  BedDouble,
  Sparkles,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Animation primitives — frame-by-frame stagger everywhere            */
/* ------------------------------------------------------------------ */

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", bounce: 0.25, duration: 0.6 },
  },
};

const pop: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", bounce: 0.35, duration: 0.6 },
  },
};

const viewportOnce = { once: true, margin: "-80px" } as const;

/** Hero H1 — each word rises in with a slight rotate (keyframe feel). */
const heroWord: Variants = {
  hidden: { opacity: 0, y: 28, rotate: 4 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { delay: 0.18 + i * 0.09, type: "spring", bounce: 0.35, duration: 0.7 },
  }),
};

/** Subtle 3D tilt wrapper for the Why-us cards. */
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 18 });
  const sry = useSpring(ry, { stiffness: 220, damping: 18 });
  return (
    <div style={{ perspective: 900 }} className="h-full">
      <motion.div
        style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          ry.set(px * 7);
          rx.set(-py * 7);
        }}
        onMouseLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LandPlot,
  Store,
  Home: HomeIcon,
  Building2,
  Warehouse,
  BedDouble,
  KeyRound,
};

const WHY_US = [
  {
    icon: BadgePercent,
    title: "Only 1% commission",
    text: "Half of what most offices charge — confirmed in writing before we start, never a rupee more.",
  },
  {
    icon: Handshake,
    title: "Direct dealing",
    text: "You sit with the owner and negotiate face to face. We facilitate — we never stand in the middle.",
  },
  {
    icon: FileCheck2,
    title: "No hidden margin",
    text: "The price on the file is the owner's price. Our fee is the 1%. That is the whole business model.",
  },
  {
    icon: MapPin,
    title: "Office in Phase 1",
    text: "151-C, Etihad Town Phase 1 — walk in any day, Mon–Sat 9 to 7. A real office, with real people.",
  },
];

const PROCESS_STEPS = [
  {
    icon: MessageSquareText,
    title: "Tell us your requirement",
    text: "Call, WhatsApp or walk into the office — tell us the area, category and budget you have in mind.",
  },
  {
    icon: ClipboardList,
    title: "We shortlist & you visit",
    text: "We match genuine, verified files to your brief and take you on site visits — usually within 48 hours.",
  },
  {
    icon: Scale,
    title: "Negotiation & agreement",
    text: "We sit with both sides and close a fair price — token, bayana and agreement, all done properly.",
  },
  {
    icon: KeyRound,
    title: "Transfer & keys",
    text: "Society transfer and documentation handled end to end — you get the keys, we've earned our 1%.",
  },
];

/* The two flagship phases showcased on the home page (Phase 3/4 intentionally excluded). */
const EXPLORE_AREAS = ["etihad-town-phase-1", "etihad-town-phase-2"]
  .map((s) => areaBySlug(s))
  .filter((a): a is NonNullable<typeof a> => Boolean(a));

const HERO_BUDGETS = [
  { value: "0", label: "Any budget" },
  { value: "5000000", label: "Up to 50 Lakh" },
  { value: "10000000", label: "Up to 1 Crore" },
  { value: "20000000", label: "Up to 2 Crore" },
  { value: "30000000", label: "Up to 3 Crore" },
  { value: "50000000", label: "Up to 5 Crore" },
  { value: "100000000", label: "Up to 10 Crore" },
];

const FOUNDED_YEAR = 2017;

export function HomeView() {
  const { navigate, setFilters } = useAppStore();

  /* ---------- data (derived-loading fetch pattern) ---------- */
  const [featured, setFeatured] = useState<Property[]>([]);
  const [latest, setLatest] = useState<Property[]>([]);
  const [featuredLoaded, setFeaturedLoaded] = useState(false);
  const [latestLoaded, setLatestLoaded] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [cats, setCats] = useState<CategoryDef[]>(CATEGORIES);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [areaCounts, setAreaCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/properties?featured=true&limit=6")
      .then((r) => r.json())
      .then((d) => setFeatured(d.properties ?? []))
      .catch(() => setFeatured([]))
      .finally(() => setFeaturedLoaded(true));

    fetch("/api/properties?sort=newest&limit=12")
      .then((r) => r.json())
      .then((d) => {
        const all = (d.properties ?? []) as Property[];
        // keep the two rails distinct: latest = newest non-featured listings
        setLatest(all.filter((p) => !p.featured).slice(0, 6));
      })
      .catch(() => setLatest([]))
      .finally(() => setLatestLoaded(true));

    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.stats))
      .catch(() => setStats(null));

    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        const list: CategoryDef[] = d.categories ?? [];
        setCats(list.length ? list : CATEGORIES);
      })
      .catch(() => setCats(CATEGORIES));

    fetch("/api/properties?limit=300")
      .then((r) => r.json())
      .then((d) => {
        const byType: Record<string, number> = {};
        const byArea: Record<string, number> = {};
        for (const p of (d.properties ?? []) as Property[]) {
          byType[p.type] = (byType[p.type] ?? 0) + 1;
          if (p.district) byArea[p.district] = (byArea[p.district] ?? 0) + 1;
        }
        setTypeCounts(byType);
        setAreaCounts(byArea);
      })
      .catch(() => {
        setTypeCounts({});
        setAreaCounts({});
      });
  }, []);

  /* ---------- hero search ---------- */
  const [heroType, setHeroType] = useState("ALL");
  const [heroArea, setHeroArea] = useState("ALL");
  const [heroBudget, setHeroBudget] = useState("0");

  const heroSearch = () => {
    setFilters({
      search: heroArea !== "ALL" ? heroArea : "",
      type: heroType,
      status: "ALL",
      beds: 0,
      minPrice: null,
      maxPrice: Number(heroBudget) > 0 ? Number(heroBudget) : null,
      sort: "newest",
    });
    navigate({ name: "properties" });
  };

  const browseType = (slug: string) => {
    setFilters({ type: slug, search: "", status: "ALL", beds: 0, minPrice: null, maxPrice: null, sort: "newest" });
    navigate({ name: "properties" });
  };

  const exploreArea = (area: string) => {
    setFilters({ search: area, type: "ALL", status: "ALL", beds: 0, minPrice: null, maxPrice: null, sort: "newest" });
    navigate({ name: "properties" });
  };

  /* ---------- hero parallax ---------- */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const parY = useTransform(scrollYProgress, [0, 1], [0, 90]);

  const years = new Date().getFullYear() - FOUNDED_YEAR;

  return (
    <div className="flex flex-col bg-background">
      {/* ================= HERO ================= */}
      <section
        ref={heroRef}
        className="relative overflow-hidden"
        aria-label="City Line Property — your key to the city"
      >
        {/* faint emerald washes on white */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_78%_8%,rgba(15,118,110,0.07),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_35%_at_8%_85%,rgba(15,118,110,0.045),transparent_70%)]" />
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left — copy + search */}
            <div>
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#0F766E]/25 bg-white/80 px-3.5 py-1.5 text-[12px] font-semibold text-[#0B6B5D] shadow-sm backdrop-blur"
              >
                <MapPin className="h-3.5 w-3.5" />
                Real Estate Office · Etihad Town, Lahore
              </motion.span>

              <h1 className="mt-5 text-[42px] font-bold leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl">
                <span className="sr-only">
                  City Line Property — real estate agency in Etihad Town, Lahore. Buy, sell and
                  rent property with only 1% commission.
                </span>
                {["Your", "Key", "to", "the", "City."].map((w, i) => (
                  <motion.span
                    key={i}
                    custom={i}
                    variants={heroWord}
                    initial="hidden"
                    animate="show"
                    className={
                      i >= 1
                        ? "text-brand-gradient mr-[0.22em] inline-block"
                        : "mr-[0.22em] inline-block"
                    }
                    aria-hidden
                  >
                    {w}
                  </motion.span>
                ))}
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.55, ease: "easeOut" }}
                className="mt-5 max-w-xl text-[15px] leading-relaxed text-neutral-600 sm:text-base"
              >
                <span className="font-semibold text-[#0B6B5D]">Only 1% commission.</span>{" "}
                Direct dealing — no hidden margin, no middlemen. Buy, sell or rent
                across Etihad Town&rsquo;s five societies with the office that calls it home.
              </motion.p>

              {/* Search card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.55, ease: "easeOut" }}
                className="mt-8 rounded-3xl border border-black/[0.07] bg-white p-3 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.28)] backdrop-blur-xl"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <Select value={heroType} onValueChange={setHeroType}>
                    <SelectTrigger className="h-11 rounded-2xl border-black/[0.06] bg-white text-[13px] font-medium focus:ring-0" aria-label="Category">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Any category</SelectItem>
                      {cats.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={heroArea} onValueChange={setHeroArea}>
                    <SelectTrigger className="h-11 rounded-2xl border-black/[0.06] bg-white text-[13px] font-medium focus:ring-0" aria-label="Area">
                      <SelectValue placeholder="Area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Any area</SelectItem>
                      {AREAS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-2 flex gap-2">
                  <Select value={heroBudget} onValueChange={setHeroBudget}>
                    <SelectTrigger className="h-11 flex-1 rounded-2xl border-black/[0.06] bg-white text-[13px] font-medium focus:ring-0" aria-label="Budget">
                      <SelectValue placeholder="Budget" />
                    </SelectTrigger>
                    <SelectContent>
                      {HERO_BUDGETS.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={heroSearch}
                    className="h-11 rounded-2xl brand-gradient px-6 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(15,118,110,0.7)] hover:opacity-95"
                    aria-label="Search listings"
                  >
                    <Search className="mr-1.5 h-4 w-4" />
                    Search
                  </Button>
                </div>
              </motion.div>

              {/* Trust row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.95, duration: 0.6 }}
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[12.5px] font-medium text-neutral-500"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-[#0F766E]" />
                  <AnimatedNumber value={stats?.properties ?? null} className="font-semibold tabular-nums text-neutral-800" />
                  live listings
                </span>
                <span aria-hidden className="h-3 w-px bg-neutral-300/70" />
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#0F766E]" />
                  <span className="font-semibold tabular-nums text-neutral-800">{AREAS.length}</span>
                  areas covered
                </span>
                <span aria-hidden className="h-3 w-px bg-neutral-300/70" />
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#0F766E]" />
                  <span className="font-semibold tabular-nums text-neutral-800">{years}+</span>
                  years in Etihad Town
                </span>
                <span
                  className="inline-flex items-center rounded-full bg-[#E7F4F0] px-3 py-1 text-[11.5px] font-bold uppercase tracking-wide text-[#0B6B5D] ring-1 ring-[#0F766E]/20"
                >
                  Only 1% commission
                </span>
              </motion.div>
            </div>

            {/* Right — parallax hero card */}
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
              className="relative"
            >
              <motion.div style={{ y: parY }} className="relative">
                <div className="relative aspect-[4/3.2] overflow-hidden rounded-[2rem] border border-black/[0.06] shadow-[0_40px_90px_-30px_rgba(15,23,42,0.35)]">
                  <motion.div
                    className="absolute inset-0"
                    initial={{ scale: 1.12 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 3.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Image
                      src="/images/hero-office.jpg"
                      alt="City Line Property head office at night — 151-C Etihad Town Phase 1, Lahore"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 520px"
                      className="object-cover"
                    />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                  {/* floating commission chip */}
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-wide text-[#0B6B5D] shadow-md backdrop-blur">
                    <BadgePercent className="h-3.5 w-3.5" />
                    Only 1% commission
                  </span>
                  {/* floating office card */}
                  <motion.button
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => navigate({ name: "contact" })}
                    className="absolute bottom-4 left-4 flex items-center gap-3 rounded-2xl border border-white/60 bg-white/95 p-3 pr-5 text-left shadow-xl backdrop-blur"
                    aria-label="Visit our office page"
                  >
                    <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl">
                      <Monogram px={44} />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#0B6B5D]">
                        Our office
                      </span>
                      <span className="text-[13px] font-semibold tracking-tight text-neutral-900">
                        151-C, Etihad Town Phase 1
                      </span>
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 text-neutral-300" />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll cue */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            onClick={() => document.getElementById("commission-band")?.scrollIntoView({ behavior: "smooth" })}
            className="mx-auto mt-12 flex flex-col items-center gap-1 text-neutral-400 transition-colors hover:text-[#0F766E]"
            aria-label="Scroll to discover our 1% promise"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">Scroll</span>
            <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
              <ChevronDown className="h-5 w-5" />
            </motion.span>
          </motion.button>
        </div>
      </section>

      {/* ================= TRUST STATS BAND ================= */}
      <section
        className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6"
        aria-label="City Line Property in numbers"
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-black/[0.07] bg-black/[0.06] shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] md:grid-cols-4"
        >
          {[
            {
              label: "Live listings",
              value: <AnimatedNumber value={stats?.properties ?? null} className="tabular-nums" />,
              sub: "Verified · published daily",
            },
            {
              label: "Societies covered",
              value: <AnimatedNumber value={AREAS.length} className="tabular-nums" />,
              sub: "Only where we work on foot",
            },
            {
              label: "Commission",
              value: <span className="brand-gradient bg-clip-text text-transparent">1%</span>,
              sub: "Flat — confirmed in writing",
            },
            {
              label: "Hidden charges",
              value: <span className="tabular-nums">0</span>,
              sub: "No margin, no middlemen",
            },
          ].map((s) => (
            <div key={s.label} className="bg-white px-5 py-6 text-center sm:px-6 sm:py-7">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-neutral-400">{s.label}</p>
              <p className="mt-1.5 text-[26px] font-bold leading-none tracking-tight text-neutral-900 sm:text-[30px]">
                {s.value}
              </p>
              <p className="mt-2 text-[11.5px] font-medium leading-snug text-neutral-400">{s.sub}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ================= EXPLORE ETIHAD TOWN ================= */}
      <section
        className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
        aria-label="Explore Etihad Town — Phase 1 and Phase 2"
      >
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <motion.div variants={item} className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0B6B5D]">Where we work</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                Explore Etihad Town.
              </h2>
            </div>
            <p className="max-w-sm text-[13.5px] leading-relaxed text-neutral-500">
              Two phases, one main boulevard — and our own office in the middle of it.
              Every file is walked and verified on foot.
            </p>
          </motion.div>

          <div className="mt-9 grid gap-5 md:grid-cols-2">
            {EXPLORE_AREAS.map((g) => {
              const count = areaCounts[g.name] ?? 0;
              return (
                <motion.button
                  key={g.slug}
                  variants={pop}
                  onClick={() => exploreArea(g.name)}
                  className="group relative block h-[340px] w-full overflow-hidden rounded-[1.75rem] text-left shadow-[0_30px_70px_-32px_rgba(15,23,42,0.45)] outline-none transition-shadow duration-300 focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 hover:shadow-[0_40px_90px_-36px_rgba(15,23,42,0.55)] sm:h-[380px]"
                  aria-label={`Explore properties in ${g.name}`}
                >
                  <Image
                    src={g.cover}
                    alt={g.name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                  />
                  <div
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,32,28,0.10)_0%,rgba(5,32,28,0.42)_55%,rgba(4,26,23,0.92)_100%)]"
                    aria-hidden
                  />
                  {g.office && (
                    <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11.5px] font-semibold text-[#0B6B5D] shadow-sm backdrop-blur">
                      <MapPin className="h-3 w-3" />
                      Our office here
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                    <h3 className="text-[22px] font-bold tracking-tight text-white sm:text-2xl">{g.name}</h3>
                    <p className="mt-1 text-[13px] font-medium text-white/85">{g.goodFor.join("  •  ")}</p>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/25 pt-4">
                      <span className="text-[12.5px] font-semibold text-white/80">
                        {count > 0
                          ? `${count} live ${count === 1 ? "listing" : "listings"}`
                          : "Files available on request"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-white transition-transform duration-300 group-hover:translate-x-1">
                        Explore Properties
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <motion.p variants={item} className="mt-6 text-center text-[13px] font-medium text-neutral-500">
            Also serving <span className="font-semibold text-[#0B6B5D]">Royal Enclave, Premier Enclave &amp; Overseas
            Block</span> —{" "}
            <button
              onClick={() => navigate({ name: "areas" })}
              className="font-semibold text-[#0B6B5D] underline decoration-[#0F766E]/30 underline-offset-4 transition-colors hover:decoration-[#0F766E]"
            >
              see all five areas
            </button>
          </motion.p>
        </motion.div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6" aria-label="What we deal in">
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <motion.div variants={item} className="text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0B6B5D]">What we deal in</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Seven ways we can help you.
            </h2>
          </motion.div>

          <div className="mt-9 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
            {cats.map((c) => {
              const Icon = CATEGORY_ICONS[c.icon] ?? Building2;
              const count = typeCounts[c.slug] ?? 0;
              return (
                <motion.button
                  key={c.slug}
                  variants={pop}
                  onClick={() => browseType(c.slug)}
                  className="group flex flex-col items-start rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_-18px_rgba(15,23,42,0.22)]"
                  style={{
                    backgroundColor: `${c.color}12`,
                    borderColor: `${c.color}33`,
                  }}
                  aria-label={`Browse ${c.name} — ${count} listings`}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: c.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="mt-3.5 text-[14.5px] font-semibold tracking-tight text-neutral-900">
                    {c.name}
                  </span>
                  <span className="mt-0.5 text-[12px] font-medium text-neutral-500">
                    {count > 0 ? `${count} live ${count === 1 ? "listing" : "listings"}` : "Ask us for files"}
                  </span>
                </motion.button>
              );
            })}

            {/* filler tile → contact */}
            <motion.button
              variants={pop}
              onClick={() => navigate({ name: "contact" })}
              className="group flex flex-col items-start rounded-2xl bg-[linear-gradient(135deg,#0F766E_0%,#0B5B54_60%,#084C46_100%)] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_-16px_rgba(15,118,110,0.55)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25 text-white">
                <Phone className="h-5 w-5" />
              </span>
              <span className="mt-3.5 text-[14.5px] font-semibold tracking-tight text-white">
                Not sure? Talk to us
              </span>
              <span className="mt-0.5 text-[12px] font-medium text-[#C7EAE2]">
                Free advice — call {BUSINESS.phonePrimary}
              </span>
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ================= FEATURED LISTINGS ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20" aria-label="Featured listings">
        <motion.div
          {...{ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: viewportOnce, transition: { duration: 0.5, ease: "easeOut" } }}
          className="flex items-end justify-between gap-4"
        >
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0B6B5D]">Handpicked for you</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Featured listings
            </h2>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate({ name: "properties" })}
            className="group hidden h-10 items-center gap-1.5 rounded-full text-sm font-medium text-neutral-600 hover:bg-[#E7F4F0] hover:text-[#0B6B5D] sm:inline-flex"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </motion.div>

        <div className="no-scrollbar -mx-4 mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          {!featuredLoaded
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[320px] shrink-0 sm:w-[350px]">
                  <PropertyCardSkeleton />
                </div>
              ))
            : featured.length === 0
              ? (
                <div className="flex w-full items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 px-6 py-10 text-center text-sm text-neutral-500">
                  Listings are being refreshed right now — please check back in a moment.
                </div>
              )
              : featured.map((p) => (
                <div key={p.id} className="w-[320px] shrink-0 snap-start sm:w-[350px]">
                  <PropertyCard property={p} />
                </div>
              ))}
        </div>

        <div className="mt-5 text-center sm:hidden">
          <Button
            variant="outline"
            onClick={() => navigate({ name: "properties" })}
            className="h-11 rounded-full border-neutral-200 bg-white text-sm font-medium"
          >
            View all properties
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ================= LATEST LISTINGS ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20" aria-label="Latest listings">
        <motion.div
          {...{ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: viewportOnce, transition: { duration: 0.5, ease: "easeOut" } }}
          className="flex items-end justify-between gap-4"
        >
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0B6B5D]">Just added to the board</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Latest listings
            </h2>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate({ name: "properties" })}
            className="group hidden h-10 items-center gap-1.5 rounded-full text-sm font-medium text-neutral-600 hover:bg-[#E7F4F0] hover:text-[#0B6B5D] sm:inline-flex"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </motion.div>

        <div className="no-scrollbar -mx-4 mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          {!latestLoaded
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[320px] shrink-0 sm:w-[350px]">
                  <PropertyCardSkeleton />
                </div>
              ))
            : latest.length === 0
              ? null
              : latest.map((p) => (
                <div key={p.id} className="w-[320px] shrink-0 snap-start sm:w-[350px]">
                  <PropertyCard property={p} />
                </div>
              ))}
        </div>

        <div className="mt-5 text-center sm:hidden">
          <Button
            variant="outline"
            onClick={() => navigate({ name: "properties" })}
            className="h-11 rounded-full border-neutral-200 bg-white text-sm font-medium"
          >
            View all properties
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ================= LEAD MAGNET — PRICE LIST ================= */}
      <PriceListLead />

      {/* ================= AREAS (real interactive map) ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20" aria-label="Explore the areas on the map">
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <motion.div variants={item} className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-wider text-[#0B6B5D]">On the map</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                Real streets. Real files.
              </h2>
            </div>
            <p className="max-w-sm text-[13.5px] leading-relaxed text-neutral-500">
              Every deal we close sits inside this pocket of Raiwind Road, Lahore —
              tap a pin to open its area guide.
            </p>
          </motion.div>
          <motion.div variants={item} className="mt-7">
            <RealMap
              className="h-[380px] w-full sm:h-[460px]"
              zoom={14}
              fitMarkers
              markers={[
                ...AREAS.map((a) => ({
                  id: a,
                  lat: AREA_COORDS[a]?.lat ?? OFFICE_COORD.lat,
                  lng: AREA_COORDS[a]?.lng ?? OFFICE_COORD.lng,
                  title: a,
                  subtitle: "Tap “View details” to open the area guide",
                  kind: "area" as const,
                })),
                {
                  id: "office",
                  lat: OFFICE_COORD.lat,
                  lng: OFFICE_COORD.lng,
                  title: "City Line Property — Office",
                  subtitle: BUSINESS.officeAddress,
                  kind: "office" as const,
                },
              ]}
              onSelect={(id) => {
                const slug = areaSlug(id);
                if (slug) navigate({ name: "area", slug });
              }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ================= WHY US ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20" aria-label="Why choose City Line Property">
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <motion.div variants={item} className="text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0B6B5D]">Why City Line</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Property, minus the games.
            </h2>
          </motion.div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((w) => (
              <motion.div key={w.title} variants={item} className="h-full">
                <TiltCard className="h-full rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_16px_44px_-24px_rgba(15,23,42,0.25)]">
                  <span className="brand-gradient flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-[0_8px_18px_-8px_rgba(15,118,110,0.6)]">
                    <w.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-neutral-900">{w.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-500">{w.text}</p>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ================= PROCESS ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20" aria-label="How a deal works">
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <motion.div variants={item} className="text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0B6B5D]">How a deal works</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Four steps. Zero surprises.
            </h2>
          </motion.div>

          <div className="relative mt-12">
            {/* connecting line — draws itself on scroll */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.35 }}
              className="absolute left-[12%] right-[12%] top-7 hidden h-[3px] origin-left rounded-full bg-gradient-to-r from-[#0F766E]/30 via-[#0F766E] to-[#0F766E]/30 sm:block"
              aria-hidden
            />
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.35 }}
              className="absolute bottom-10 left-7 top-10 w-[3px] origin-top rounded-full bg-gradient-to-b from-[#0F766E] to-[#0F766E]/20 sm:hidden"
              aria-hidden
            />

            <ol className="grid gap-10 sm:grid-cols-4 sm:gap-4">
              {PROCESS_STEPS.map((s, i) => (
                <motion.li key={s.title} variants={item} className="relative flex gap-5 sm:flex-col sm:items-center sm:gap-0 sm:text-center">
                  <span className="brand-gradient relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white shadow-[0_8px_20px_-6px_rgba(15,118,110,0.6)] ring-4 ring-[#0F766E]/15">
                    {i + 1}
                  </span>
                  <div className="sm:mt-5">
                    <span className="mb-2 hidden h-10 w-10 items-center justify-center rounded-xl bg-[#E7F4F0] text-[#0B6B5D] sm:flex sm:mx-auto">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-[15px] font-semibold tracking-tight text-neutral-900">{s.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">{s.text}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </motion.div>
      </section>

      {/* ================= REQUIREMENT FORM ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20" aria-label="Post your requirement">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.p variants={item} className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0B6B5D]">
              Post your requirement
            </motion.p>
            <motion.h2 variants={item} className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Tell us once — we call you back.
            </motion.h2>
            <motion.p variants={item} className="mt-3 max-w-md text-[14.5px] leading-relaxed text-neutral-500">
              Skip scrolling through fake ads. Post your requirement once and our team
              shortlists genuine files for you — usually within 48 hours.
            </motion.p>
            <motion.ul variants={container} className="mt-6 space-y-3.5">
              {[
                "A real call back within working hours — not a bot, not a call centre",
                "Only verified files from our five areas, matched to your budget",
                "1% commission confirmed in writing before anything moves",
              ].map((li) => (
                <motion.li key={li} variants={item} className="flex items-start gap-3 text-[14px] text-neutral-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0F766E]/10">
                    <Check className="h-3 w-3 text-[#0F766E]" />
                  </span>
                  {li}
                </motion.li>
              ))}
            </motion.ul>
            <motion.button
              variants={item}
              onClick={() => window.open(waLink("Hi City Line Property — I want to discuss a property requirement."), "_blank", "noopener")}
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#22C55E]/40 bg-white px-5 py-2.5 text-[13px] font-semibold text-[#15803D] shadow-sm transition-colors hover:bg-[#22C55E]/10"
            >
              <MessageCircle className="h-4 w-4" />
              Or WhatsApp us right now
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="rounded-3xl border border-black/[0.07] bg-white p-6 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.3)] sm:p-8"
          >
            <RequirementForm />
          </motion.div>
        </div>
      </section>


      {/* ================= FINAL CTA BAND ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-6 pt-16 sm:px-6 sm:pt-20" aria-label="Visit our office">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0F766E_0%,#0B5B54_55%,#084C46_100%)] px-8 py-14 text-center shadow-[0_40px_90px_-35px_rgba(15,118,110,0.65)] sm:py-16"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_50%_0%,rgba(255,255,255,0.12),transparent_70%)]" />
          <div className="relative">
            <span className="mx-auto flex w-fit">
              <Monogram px={64} />
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Visit our office — 151-C, Etihad Town Phase 1
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-[#C7EAE2]">
              Bring your requirement over a cup of chai. Direct dealing, honest advice
              and the same 1% commission — face to face.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-full bg-white px-7 text-sm font-semibold text-[#0B5B54] shadow-[0_10px_26px_-10px_rgba(0,0,0,0.45)] hover:bg-white/90"
              >
                <a href={`tel:${BUSINESS.telPrimary}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call {BUSINESS.phonePrimary}
                </a>
              </Button>
              <Button
                asChild
                className="h-12 rounded-full border border-white/50 bg-white/10 px-7 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
              >
                <a
                  href={waLink("Hi City Line Property — I'd like to visit your office in Etihad Town Phase 1.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp {BUSINESS.phoneSecondary}
                </a>
              </Button>
            </div>
            <p className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[12.5px] font-semibold text-white ring-1 ring-white/20 backdrop-blur">
              <Clock className="h-4 w-4" />
              {BUSINESS.hours}
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
