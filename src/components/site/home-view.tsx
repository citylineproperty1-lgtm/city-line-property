"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useScroll, useSpring, useTransform, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyCard, PropertyCardSkeleton } from "@/components/site/property-card";
import { AnimatedNumber } from "@/components/site/animated-number";
import { AreaMap } from "@/components/site/area-map";
import { RecentStrip } from "@/components/site/recent-strip";
import { RequirementForm } from "@/components/site/requirement-form";
import { useAppStore } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { AREAS, BUSINESS, waLink } from "@/lib/business";
import {
  CATEGORIES,
  type CategoryDef,
  type PlatformStats,
  type Property,
  type TestimonialItem,
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

const GOLD = "#C9A227";
const GOLD_DEEP = "#8F7018";

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

/**
 * Store-independent PKR formatter (South-Asian numbering) for the calculator.
 * Unlike formatPKR it never reads the persisted currency during SSR, so the
 * markup is hydration-safe no matter which currency the visitor saved.
 */
function formatPkrStatic(price: number): string {
  const abs = Math.abs(price);
  if (abs >= 10_000_000) {
    const cr = price / 10_000_000;
    return `PKR ${cr.toFixed(cr >= 100 || Number.isInteger(cr) ? 0 : 1)} Crore`;
  }
  if (abs >= 100_000) {
    const lac = price / 100_000;
    return `PKR ${lac.toFixed(lac >= 100 || Number.isInteger(lac) ? 0 : 1)} Lakh`;
  }
  return `PKR ${new Intl.NumberFormat("en-PK").format(Math.round(price))}`;
}

/** Spring-eased money counter that eases from its previous value (no 0 reset). */
function MoneySpring({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    const from = displayRef.current;
    const to = value;
    if (from === to) return;
    let raf = 0;
    const start = performance.now();
    const dur = 480;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(from + (to - from) * eased);
      displayRef.current = current;
      setDisplay(current);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className="tabular-nums" aria-live="polite">
      {formatPkrStatic(display)}
    </span>
  );
}

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

const COMMISSION_PHRASES = ["ONLY 1% COMMISSION", "DIRECT DEALING", "NO HIDDEN MARGIN", "NO MIDDLEMEN"];

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

/* Log-mapped slider: 20 Lakh → 10 Crore so common values aren't squeezed. */
const MIN_VALUE = 2_000_000;
const MAX_VALUE = 100_000_000;
const sliderToValue = (v: number) =>
  Math.round((MIN_VALUE * Math.pow(MAX_VALUE / MIN_VALUE, v / 1000)) / 100_000) * 100_000;
const valueToSlider = (p: number) =>
  Math.round((1000 * Math.log(p / MIN_VALUE)) / Math.log(MAX_VALUE / MIN_VALUE));

const BUDGET_PRESETS = [
  { label: "50 Lakh", price: 5_000_000 },
  { label: "1 Crore", price: 10_000_000 },
  { label: "2.5 Crore", price: 25_000_000 },
  { label: "5 Crore", price: 50_000_000 },
];

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
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [cats, setCats] = useState<CategoryDef[]>(CATEGORIES);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/properties?featured=true&limit=6")
      .then((r) => r.json())
      .then((d) => setFeatured(d.properties ?? []))
      .catch(() => setFeatured([]));

    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((d) => setTestimonials(d.testimonials ?? []))
      .catch(() => setTestimonials([]));

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

    fetch("/api/insights")
      .then((r) => r.json())
      .then((d) => {
        const rec: Record<string, number> = {};
        for (const t of d.insights?.typeMix ?? []) rec[t.type] = t.count;
        setTypeCounts(rec);
      })
      .catch(() => setTypeCounts({}));
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

  /* ---------- savings calculator ---------- */
  const [sliderV, setSliderV] = useState(411); // ≈ 1 Crore
  const propertyValue = sliderToValue(sliderV);
  const typicalFee = propertyValue * 0.02;
  const ourFee = propertyValue * 0.01;
  const savings = propertyValue * 0.01;

  /* ---------- hero parallax ---------- */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const parY = useTransform(scrollYProgress, [0, 1], [0, 90]);

  const years = new Date().getFullYear() - FOUNDED_YEAR;

  return (
    <div className="flex flex-col bg-[#FAF7EF]">
      {/* ================= HERO ================= */}
      <section
        ref={heroRef}
        className="relative overflow-hidden"
        aria-label="City Line Property — your key to the city"
      >
        {/* warm ivory + gold radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_78%_8%,rgba(201,162,39,0.18),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_35%_at_8%_85%,rgba(201,162,39,0.10),transparent_70%)]" />
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left — copy + search */}
            <div>
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A227]/30 bg-white/80 px-3.5 py-1.5 text-[12px] font-semibold text-[#8F7018] shadow-sm backdrop-blur"
              >
                <MapPin className="h-3.5 w-3.5" />
                Real Estate Office · Etihad Town, Lahore
              </motion.span>

              <h1
                className="mt-5 text-[42px] font-bold leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl"
                aria-label="Your Key to the City."
              >
                {["Your", "Key", "to", "the", "City."].map((w, i) => (
                  <motion.span
                    key={i}
                    custom={i}
                    variants={heroWord}
                    initial="hidden"
                    animate="show"
                    className={
                      i >= 1
                        ? "mr-[0.22em] inline-block bg-gradient-to-br from-[#DCC059] via-[#C9A227] to-[#8F7018] bg-clip-text text-transparent"
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
                <span className="font-semibold text-[#8F7018]">Only 1% commission.</span>{" "}
                Direct dealing — no hidden margin, no middlemen. Buy, sell or rent
                across Etihad Town&rsquo;s five societies with the office that calls it home.
              </motion.p>

              {/* Search card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.55, ease: "easeOut" }}
                className="mt-8 rounded-3xl border border-white/70 bg-white/70 p-3 shadow-[0_24px_60px_-24px_rgba(140,105,25,0.35)] backdrop-blur-xl"
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
                    className="h-11 rounded-2xl bg-neutral-900 px-6 text-sm font-semibold text-white hover:bg-neutral-800"
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
                  <Building2 className="h-3.5 w-3.5 text-[#A8851D]" />
                  <AnimatedNumber value={stats?.properties ?? null} className="font-semibold tabular-nums text-neutral-800" />
                  live listings
                </span>
                <span aria-hidden className="h-3 w-px bg-neutral-300/70" />
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#A8851D]" />
                  <span className="font-semibold tabular-nums text-neutral-800">{AREAS.length}</span>
                  areas covered
                </span>
                <span aria-hidden className="h-3 w-px bg-neutral-300/70" />
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#A8851D]" />
                  <span className="font-semibold tabular-nums text-neutral-800">{years}+</span>
                  years in Etihad Town
                </span>
                <span
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-[#DCBB55] via-[#C9A227] to-[#A8851D] px-3 py-1 text-[11.5px] font-bold uppercase tracking-wide text-white shadow-sm"
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
                <div className="relative aspect-[4/3.2] overflow-hidden rounded-[2rem] border border-white/60 shadow-[0_40px_90px_-30px_rgba(140,105,25,0.45)]">
                  <Image
                    src="/images/hero-lahore.png"
                    alt="Main boulevard of a modern housing society in Lahore at golden hour"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 520px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                  {/* floating commission chip */}
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-wide text-[#8F7018] shadow-md backdrop-blur">
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
                    <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#C9A227]/10">
                      <Image src="/logo.png" alt="" width={26} height={26} className="object-contain" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#A8851D]">
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
            className="mx-auto mt-12 flex flex-col items-center gap-1 text-neutral-400 transition-colors hover:text-[#A8851D]"
            aria-label="Scroll to discover our 1% promise"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">Scroll</span>
            <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
              <ChevronDown className="h-5 w-5" />
            </motion.span>
          </motion.button>
        </div>
      </section>

      {/* ================= GOLD COMMISSION BAND ================= */}
      <section
        id="commission-band"
        aria-label="Only 1% commission — direct dealing — no hidden margin — no middlemen"
        className="relative overflow-hidden border-y border-[#8F7018]/30 bg-gradient-to-r from-[#A8851D] via-[#D3AC35] to-[#A8851D] py-4 sm:py-5"
      >
        <motion.div
          className="flex w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 26, ease: "linear", repeat: Infinity }}
        >
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
              {COMMISSION_PHRASES.map((p) => (
                <span key={p} className="flex items-center">
                  <span className="whitespace-nowrap px-6 text-2xl font-extrabold uppercase tracking-wide text-[#2E2606] sm:text-4xl">
                    {p}
                  </span>
                  <span className="text-xl text-[#FFF3D0] sm:text-2xl">✦</span>
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ================= SAVINGS CALCULATOR ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24" aria-label="Commission savings calculator">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#DCBB55] via-[#C9A227] to-[#A8851D] p-7 shadow-[0_40px_90px_-35px_rgba(140,105,25,0.6)] sm:p-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_40%_at_85%_15%,rgba(255,255,255,0.35),transparent_70%)]" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <motion.p variants={item} className="text-[12.5px] font-bold uppercase tracking-[0.2em] text-[#3D3108]">
                Why pay more?
              </motion.p>
              <motion.h2
                variants={item}
                className="mt-2 text-2xl font-bold leading-tight tracking-tight text-[#2E2606] sm:text-4xl"
              >
                The 1% difference — see what you keep.
              </motion.h2>
              <motion.p variants={item} className="mt-3 max-w-md text-[14px] leading-relaxed text-[#4A3C10]">
                Drag the slider to your property value. A typical dealer charges 2%
                (or quietly builds their margin into the price). We charge a flat 1% —
                and show you everything in writing.
              </motion.p>

              <motion.div variants={item} className="mt-8">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-semibold text-[#3D3108]">Property value</span>
                  <span className="rounded-full bg-white/25 px-3.5 py-1 text-[15px] font-bold tabular-nums text-[#2E2606] backdrop-blur">
                    {formatPkrStatic(propertyValue)}
                  </span>
                </div>
                <Slider
                  value={[sliderV]}
                  onValueChange={(v) => setSliderV(v[0] ?? 411)}
                  min={0}
                  max={1000}
                  step={1}
                  aria-label="Property value"
                  className="mt-4 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-track]]:border-white/40 [&_[data-slot=slider-track]]:bg-[#8F7018]/25 [&_[data-slot=slider-thumb]]:border-4 [&_[data-slot=slider-thumb]]:border-[#C9A227] [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
                />
                <div className="mt-2 flex justify-between text-[11.5px] font-semibold text-[#5B4A14]">
                  <span>20 Lakh</span>
                  <span>10 Crore</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {BUDGET_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setSliderV(valueToSlider(p.price))}
                      className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                        propertyValue === p.price
                          ? "border-[#2E2606] bg-[#2E2606] text-[#F5E6B8]"
                          : "border-[#8F7018]/30 bg-white/20 text-[#3D3108] hover:bg-white/35"
                      }`}
                      aria-pressed={propertyValue === p.price}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              variants={pop}
              className="rounded-3xl bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8"
            >
              <p className="flex items-center justify-between text-[13.5px] text-neutral-500">
                <span>Typical dealer fee (2%)</span>
                <span className="font-semibold tabular-nums text-neutral-400 line-through decoration-neutral-300">
                  {formatPkrStatic(typicalFee)}
                </span>
              </p>
              <p className="mt-3 flex items-center justify-between text-[13.5px] text-neutral-700">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: GOLD }} />
                  City Line fee (1%)
                </span>
                <span className="font-bold tabular-nums text-[#8F7018]">{formatPkrStatic(ourFee)}</span>
              </p>
              <div className="mt-5 border-t border-dashed border-neutral-200 pt-5">
                <p className="text-[12.5px] font-semibold uppercase tracking-wider text-neutral-400">
                  You save
                </p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#8F7018] sm:text-4xl">
                  <MoneySpring value={savings} />
                </p>
                <p className="mt-3 rounded-xl bg-[#C9A227]/10 px-3.5 py-2.5 text-[12px] leading-relaxed text-[#6B5510]">
                  On a {formatPkrStatic(propertyValue)} deal, that&rsquo;s real money back in your pocket —
                  and the same honest 1% whether it&rsquo;s a plot, a house or a hall.
                </p>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">
                Illustration only — your fee is always confirmed in writing before any deal,
                and rentals are charged at an agreed flat rate.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6" aria-label="What we deal in">
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <motion.div variants={item} className="text-center">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[#A8851D]">What we deal in</p>
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
                  className="group flex flex-col items-start rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(140,105,25,0.4)]"
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
              className="group flex flex-col items-start rounded-2xl bg-gradient-to-br from-[#DCBB55] via-[#C9A227] to-[#A8851D] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-14px_rgba(140,105,25,0.55)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25 text-white">
                <Phone className="h-5 w-5" />
              </span>
              <span className="mt-3.5 text-[14.5px] font-semibold tracking-tight text-white">
                Not sure? Talk to us
              </span>
              <span className="mt-0.5 text-[12px] font-medium text-[#FFF3D0]">
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
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[#A8851D]">Handpicked for you</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Featured listings
            </h2>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate({ name: "properties" })}
            className="group hidden h-10 items-center gap-1.5 rounded-full text-sm font-medium text-neutral-600 hover:bg-[#C9A227]/10 hover:text-[#8F7018] sm:inline-flex"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </motion.div>

        <div className="no-scrollbar -mx-4 mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          {featured.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[320px] shrink-0 sm:w-[350px]">
                  <PropertyCardSkeleton />
                </div>
              ))
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

      {/* ================= AREAS (interactive map) ================= */}
      <AreaMap />

      {/* ================= WHY US ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20" aria-label="Why choose City Line Property">
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <motion.div variants={item} className="text-center">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[#A8851D]">Why City Line</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Property, minus the games.
            </h2>
          </motion.div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((w) => (
              <motion.div key={w.title} variants={item} className="h-full">
                <TiltCard className="h-full rounded-2xl border border-white/70 bg-white/70 p-6 shadow-[0_16px_44px_-24px_rgba(140,105,25,0.4)] backdrop-blur-xl">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#DCBB55] to-[#A8851D] text-white shadow-sm">
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
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[#A8851D]">How a deal works</p>
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
              className="absolute left-[12%] right-[12%] top-7 hidden h-[3px] origin-left rounded-full bg-gradient-to-r from-[#C9A227]/30 via-[#C9A227] to-[#C9A227]/30 sm:block"
              aria-hidden
            />
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.35 }}
              className="absolute bottom-10 left-7 top-10 w-[3px] origin-top rounded-full bg-gradient-to-b from-[#C9A227] to-[#C9A227]/20 sm:hidden"
              aria-hidden
            />

            <ol className="grid gap-10 sm:grid-cols-4 sm:gap-4">
              {PROCESS_STEPS.map((s, i) => (
                <motion.li key={s.title} variants={item} className="relative flex gap-5 sm:flex-col sm:items-center sm:gap-0 sm:text-center">
                  <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#DCBB55] via-[#C9A227] to-[#A8851D] text-lg font-extrabold text-white shadow-[0_8px_20px_-6px_rgba(140,105,25,0.6)] ring-4 ring-[#C9A227]/15">
                    {i + 1}
                  </span>
                  <div className="sm:mt-5">
                    <span className="mb-2 hidden h-10 w-10 items-center justify-center rounded-xl bg-[#C9A227]/12 text-[#8F7018] sm:flex sm:mx-auto">
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

      {/* ================= TESTIMONIALS ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20" aria-label="Client testimonials">
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <motion.div variants={item} className="text-center">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[#A8851D]">Client words</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Deals that ended in handshakes.
            </h2>
          </motion.div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {(testimonials.length
              ? testimonials
              : Array.from({ length: 4 }).map(() => null)
            ).map((t, i) =>
              t === null ? (
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/70" />
              ) : (
                <motion.figure
                  key={t.id}
                  variants={item}
                  className="flex flex-col rounded-2xl border border-white/70 bg-white/80 p-6 shadow-[0_16px_44px_-28px_rgba(140,105,25,0.45)] backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <Quote className="h-5 w-5 text-[#C9A227]/60" />
                    <span className="flex gap-0.5" aria-label={`${t.rating} star rating`}>
                      {Array.from({ length: t.rating }).map((_, s) => (
                        <Star key={s} className="h-3.5 w-3.5 fill-[#C9A227] text-[#C9A227]" />
                      ))}
                    </span>
                  </div>
                  <blockquote className="mt-3 flex-1 text-[13.5px] leading-relaxed text-neutral-600">
                    &ldquo;{t.content}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-neutral-100 pt-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#DCBB55] to-[#A8851D] text-[11px] font-bold text-white">
                      {t.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-neutral-900">{t.name}</p>
                      <p className="truncate text-[12px] text-neutral-400">{t.role}</p>
                    </div>
                  </figcaption>
                </motion.figure>
              )
            )}
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
            <motion.p variants={item} className="text-[13px] font-semibold uppercase tracking-wider text-[#A8851D]">
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
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C9A227]/15">
                    <Check className="h-3 w-3 text-[#8F7018]" />
                  </span>
                  {li}
                </motion.li>
              ))}
            </motion.ul>
            <motion.button
              variants={item}
              onClick={() => window.open(waLink("Hi City Line Property — I want to discuss a property requirement."), "_blank", "noopener")}
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#C9A227]/40 bg-white/80 px-5 py-2.5 text-[13px] font-semibold text-[#8F7018] shadow-sm backdrop-blur transition-colors hover:bg-[#C9A227]/10"
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
            className="rounded-3xl border border-white/70 bg-white p-6 shadow-[0_30px_70px_-30px_rgba(140,105,25,0.4)] backdrop-blur sm:p-8"
          >
            <RequirementForm />
          </motion.div>
        </div>
      </section>

      <RecentStrip />

      {/* ================= FINAL CTA BAND ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-6 pt-16 sm:px-6 sm:pt-20" aria-label="Visit our office">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#DCBB55] via-[#C9A227] to-[#A8851D] px-8 py-14 text-center shadow-[0_40px_90px_-35px_rgba(140,105,25,0.65)] sm:py-16"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_50%_0%,rgba(255,255,255,0.4),transparent_70%)]" />
          <div className="relative">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
              <Image src="/logo.png" alt="City Line Property logo" width={40} height={40} className="object-contain" />
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl text-2xl font-bold tracking-tight text-[#2E2606] sm:text-4xl">
              Visit our office — 151-C, Etihad Town Phase 1
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-[#4A3C10]">
              Bring your requirement over a cup of chai. Direct dealing, honest advice
              and the same 1% commission — face to face.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-full bg-neutral-900 px-7 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                <a href={`tel:${BUSINESS.telPrimary}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call {BUSINESS.phonePrimary}
                </a>
              </Button>
              <Button
                asChild
                className="h-12 rounded-full border border-white/60 bg-white/15 px-7 text-sm font-semibold text-[#2E2606] backdrop-blur hover:bg-white/30"
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
            <p className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-2 text-[12.5px] font-semibold text-[#2E2606] backdrop-blur">
              <Clock className="h-4 w-4" />
              {BUSINESS.hours}
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
