"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { AREAS, AREA_SHORT } from "@/lib/business";
import { areaSlug } from "@/lib/areas";

type DistrictStat = {
  district: string;
  count: number;
  saleAvg: number;
  rentAvg: number;
};

/** Hand-placed stylised geography of the Etihad Town pocket (viewBox 900×540):
 *  Overseas Block north, Phase 1 centre (office), Phase 2 east,
 *  Royal Enclave south-west, Premier Enclave south-east. */
const PLACEMENTS: Record<string, { x: number; y: number }> = {
  "Overseas Block": { x: 565, y: 88 },
  "Etihad Town Phase 1": { x: 430, y: 252 },
  "Etihad Town Phase 2": { x: 728, y: 226 },
  "Royal Enclave": { x: 225, y: 402 },
  "Premier Enclave": { x: 612, y: 420 },
};

const MAIN_BOULEVARD = "M 30 312 Q 240 288 430 252 Q 600 222 878 200";
const BRANCHES = [
  "M 430 252 Q 472 168 548 100", // north to Overseas Block
  "M 430 252 Q 328 322 238 388", // south-west to Royal Enclave
  "M 430 252 Q 522 332 600 406", // south-east to Premier Enclave
];

export function AreaMap() {
  const { navigate, setFilters } = useAppStore();
  const [byDistrict, setByDistrict] = useState<DistrictStat[] | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/insights")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setByDistrict(d.insights?.byDistrict ?? []);
      })
      .catch(() => {
        if (alive) setByDistrict([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const statFor = (name: string): DistrictStat =>
    byDistrict?.find((d) => d.district === name) ?? { district: name, count: 0, saleAvg: 0, rentAvg: 0 };

  if (byDistrict === null) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-6" aria-label="Explore our areas">
        <div className="h-[440px] animate-pulse rounded-3xl bg-neutral-100/70" />
      </section>
    );
  }

  const goArea = (name: string) => {
    navigate({ name: "area", slug: areaSlug(name) });
  };

  const browseListings = (name: string) => {
    setFilters({
      search: name,
      status: "ALL",
      type: "ALL",
      beds: 0,
      minPrice: null,
      maxPrice: null,
      sort: "newest",
    });
    navigate({ name: "properties" });
  };

  const radiusFor = (count: number) => Math.min(17 + count * 2.2, 32);
  const hoveredStat = hovered ? statFor(hovered) : null;
  const hoveredPos = hovered ? PLACEMENTS[hovered] : null;
  const totalListings = AREAS.reduce((n, a) => n + statFor(a).count, 0);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-6" aria-label="Explore our five areas">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#A8851D]">
            Where we deal
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Five areas. Known street by street.
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">
            We only work where we can vouch for every file — the Etihad Town pocket
            and its neighbouring enclaves. Tap an area to read its guide, or use the
            chips below to jump straight to listings.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => navigate({ name: "properties" })}
          className="group hidden h-10 items-center gap-1.5 rounded-full text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 sm:inline-flex"
        >
          Browse all {totalListings > 0 ? `${totalListings} ` : ""}listings
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </motion.div>

      {/* Map canvas */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
        className="relative mt-8 overflow-hidden rounded-3xl border border-black/[0.07] bg-[#FBF8F1] shadow-[0_24px_70px_-32px_rgba(120,90,20,0.35)]"
      >
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-50" />

        <svg
          viewBox="0 0 900 540"
          className="relative block h-auto w-full"
          role="group"
          aria-label="Stylised map of the five areas City Line Property deals in"
        >
          <defs>
            <linearGradient id="officeGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E2C25C" />
              <stop offset="55%" stopColor="#C9A227" />
              <stop offset="100%" stopColor="#A8851D" />
            </linearGradient>
          </defs>

          {/* Society green patches (subtle landscaping) */}
          <ellipse cx="150" cy="150" rx="110" ry="70" className="fill-[#E4EAD8]/60" />
          <ellipse cx="790" cy="420" rx="120" ry="80" className="fill-[#E4EAD8]/50" />
          <ellipse cx="430" cy="480" rx="150" ry="55" className="fill-[#EAE9DA]/60" />

          {/* Main Boulevard — wide road band + centre line */}
          <path d={MAIN_BOULEVARD} fill="none" stroke="#E9E0CB" strokeWidth="16" strokeLinecap="round" />
          <path
            d={MAIN_BOULEVARD}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="10 12"
            opacity="0.9"
          />
          <path id="boulevardPath" d={MAIN_BOULEVARD} fill="none" stroke="none" />
          <text className="fill-[#B09B6B] text-[13px] font-semibold uppercase" style={{ letterSpacing: "0.3em" }}>
            <textPath href="#boulevardPath" startOffset="14%">
              Main Boulevard
            </textPath>
          </text>

          {/* Branch roads */}
          {BRANCHES.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="#E5DCC6"
              strokeWidth="8"
              strokeLinecap="round"
            />
          ))}

          {/* Dotted ring road around Phase 1 */}
          <motion.ellipse
            cx="430"
            cy="252"
            rx="150"
            ry="102"
            fill="none"
            stroke="#C9A227"
            strokeWidth="2"
            strokeDasharray="2 10"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.55 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1, delay: 0.4 }}
          />
          <text
            x="430"
            y="136"
            textAnchor="middle"
            className="fill-[#B09B6B] text-[11px] font-medium uppercase"
            style={{ letterSpacing: "0.25em" }}
          >
            Ring Road
          </text>

          {/* Landmark: society entrance arch (west) */}
          <g className="pointer-events-none" opacity="0.8">
            <circle cx="60" cy="308" r="4" className="fill-[#C9A227]" />
            <text x="72" y="336" className="fill-[#B09B6B] text-[11px] font-medium">
              Main Gate
            </text>
          </g>

          {/* Area nodes */}
          {AREAS.map((area, i) => {
            const pos = PLACEMENTS[area];
            const stat = statFor(area);
            const r = radiusFor(stat.count);
            const isOffice = area === "Etihad Town Phase 1";
            const isHover = hovered === area;
            return (
              <g key={area} transform={`translate(${pos.x} ${pos.y})`}>
                <motion.g
                  initial={{ opacity: 0, scale: 0.3 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    type: "spring",
                    bounce: 0.4,
                    duration: 0.75,
                    delay: 0.15 + i * 0.11,
                  }}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  className="cursor-pointer"
                  onClick={() => goArea(area)}
                  onMouseEnter={() => setHovered(area)}
                  onMouseLeave={() => setHovered(null)}
                  role="button"
                  aria-label={`${area} — ${stat.count} listings. Open the ${area} area guide.`}
                >
                  {/* gold pulse halo on the office node */}
                  {isOffice && (
                    <motion.circle
                      className="fill-[#C9A227]"
                      initial={{ r: r + 8, opacity: 0.4 }}
                      animate={{ r: [r + 8, r + 26], opacity: [0.35, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  {/* halo */}
                  <circle
                    r={r + (isHover ? 10 : 6)}
                    className={isOffice ? "fill-[#C9A227]/15 transition-all duration-300" : "fill-neutral-900/10 transition-all duration-300"}
                  />
                  <circle r={r + 1.5} fill="none" className="stroke-white" strokeWidth="3" />
                  <circle
                    r={r}
                    fill={isOffice ? "url(#officeGold)" : isHover ? "#23201B" : "#3D3830"}
                    strokeWidth={0}
                    className="transition-all duration-300"
                  />
                  {isOffice ? (
                    <g className="pointer-events-none" transform="translate(0 0.5)">
                      <path
                        d="M -6.5 1.5 L 0 -5 L 6.5 1.5 M -4 0.5 L -4 6 L 4 6 L 4 0.5"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  ) : (
                    <text
                      y="4.5"
                      textAnchor="middle"
                      className="pointer-events-none fill-white text-[13px] font-semibold"
                    >
                      {stat.count}
                    </text>
                  )}
                  {/* label */}
                  <text
                    y={r + (isOffice ? 30 : 22)}
                    textAnchor="middle"
                    stroke="#FBF8F1"
                    strokeWidth="4"
                    paintOrder="stroke"
                    className={
                      isOffice
                        ? "pointer-events-none fill-[#8F7018] text-[15px] font-bold"
                        : isHover
                          ? "pointer-events-none fill-neutral-900 text-[14.5px] font-semibold"
                          : "pointer-events-none fill-neutral-600 text-[14.5px] font-medium transition-all"
                    }
                  >
                    {AREA_SHORT[area] ?? area}
                  </text>
                </motion.g>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/85 px-3.5 py-1.5 text-[11.5px] font-medium text-neutral-600 shadow-sm backdrop-blur">
          <span className="flex h-3.5 w-3.5 items-center justify-center">
            <Star className="h-3 w-3 fill-[#C9A227] text-[#C9A227]" />
          </span>
          Our office is here — 151-C, Phase 1
        </div>

        {/* Hover tooltip */}
        {hoveredStat && hoveredPos && (
          <div
            className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 -translate-y-full rounded-2xl border border-black/[0.07] bg-white p-3.5 shadow-xl"
            style={{
              left: `${(hoveredPos.x / 900) * 100}%`,
              top: `calc(${(hoveredPos.y / 540) * 100}% - 30px)`,
            }}
            role="status"
          >
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-900">
              <MapPin className="h-3.5 w-3.5 text-[#A8851D]" />
              {hoveredStat.district}
              {hoveredStat.district === "Etihad Town Phase 1" && (
                <span className="rounded-full bg-[#C9A227]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8F7018]">
                  Office
                </span>
              )}
            </p>
            <p className="mt-1 text-[12px] font-medium text-neutral-400">
              {hoveredStat.count} {hoveredStat.count === 1 ? "listing" : "listings"}
            </p>
            <div className="mt-2 space-y-1 border-t border-neutral-100 pt-2 text-[12px]">
              {hoveredStat.saleAvg > 0 && (
                <p className="flex justify-between gap-2">
                  <span className="text-neutral-400">Avg. sale</span>
                  <span className="font-semibold tabular-nums text-neutral-800">
                    {formatPKR(hoveredStat.saleAvg)}
                  </span>
                </p>
              )}
              {hoveredStat.rentAvg > 0 && (
                <p className="flex justify-between gap-2">
                  <span className="text-neutral-400">Avg. rent</span>
                  <span className="font-semibold tabular-nums text-neutral-800">
                    {formatPKR(hoveredStat.rentAvg, true)}
                  </span>
                </p>
              )}
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11.5px] font-semibold text-[#8F7018]">
              <TrendingUp className="h-3 w-3" />
              Open the area guide
            </p>
          </div>
        )}
      </motion.div>

      {/* Quick chips (mobile-friendly alternative targets) */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {AREAS.map((area) => {
          const stat = statFor(area);
          const isOffice = area === "Etihad Town Phase 1";
          return (
            <button
              key={area}
              onClick={() => browseListings(area)}
              className="group flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-neutral-600 transition-all hover:border-[#C9A227]/50 hover:bg-[#C9A227]/10 hover:text-[#8F7018]"
              aria-label={`Browse listings in ${area}`}
            >
              {isOffice && <Star className="h-3 w-3 fill-[#C9A227] text-[#C9A227]" />}
              {AREA_SHORT[area] ?? area}
              <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums text-neutral-500 transition-colors group-hover:bg-white group-hover:text-[#8F7018]">
                {stat.count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
