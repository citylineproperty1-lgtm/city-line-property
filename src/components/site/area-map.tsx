"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { formatPKR } from "@/lib/format";

type DistrictStat = {
  district: string;
  count: number;
  saleAvg: number;
  rentAvg: number;
};

/** Hand-placed stylised positions (viewBox 900×520) roughly matching
 *  Karachi's real geography: Arabian Sea at the bottom, suburbs fanning north. */
const PLACEMENTS: Record<string, { x: number; y: number }> = {
  Gadap: { x: 120, y: 80 },
  "Bahria Town": { x: 780, y: 100 },
  "North Nazimabad": { x: 320, y: 160 },
  "Gulshan-e-Iqbal": { x: 560, y: 190 },
  PECHS: { x: 470, y: 275 },
  Saddar: { x: 330, y: 320 },
  Clifton: { x: 185, y: 365 },
  "DHA Phase 6": { x: 570, y: 335 },
  "DHA Phase 8": { x: 690, y: 385 },
};

/** Faint arterial roads for visual grounding. */
const ROADS: string[] = [
  "M 185 365 Q 255 350 330 320 Q 400 298 470 275 Q 525 300 570 335 Q 630 355 690 385",
  "M 470 275 Q 515 235 560 190 Q 660 150 780 100",
  "M 320 160 Q 440 175 560 190",
  "M 120 80 Q 215 115 320 160",
];

export function AreaMap() {
  const { navigate, setFilters } = useAppStore();
  const [districts, setDistricts] = useState<DistrictStat[] | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/insights")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setDistricts(
          (d.insights?.byDistrict ?? []).filter(
            (x: DistrictStat) => PLACEMENTS[x.district]
          )
        );
      })
      .catch(() => alive && setDistricts([]));
    return () => {
      alive = false;
    };
  }, []);

  if (districts === null) {
    return <div className="h-[420px] animate-pulse rounded-3xl bg-neutral-100/70" />;
  }
  if (districts.length === 0) return null;

  const goDistrict = (name: string) => {
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

  const radiusFor = (count: number) => Math.min(15 + count * 4.5, 26);
  const hoveredStat = districts.find((d) => d.district === hovered) ?? null;
  const hoveredPos = hovered ? PLACEMENTS[hovered] : null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-6" aria-label="Explore Karachi by area">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wider text-emerald-600">
            Explore by area
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Know the neighbourhoods.
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">
            Every dot is a live pocket of the city — sized by how much we have
            listed there. Tap one to browse its homes.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => navigate({ name: "properties" })}
          className="group hidden h-10 items-center gap-1.5 rounded-full text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 sm:inline-flex"
        >
          Browse all areas
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </motion.div>

      {/* Map canvas */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
        className="relative mt-8 overflow-hidden rounded-3xl border border-neutral-200/80 bg-[#fafafa] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.15)]"
      >
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-60" />

        <svg
          viewBox="0 0 900 520"
          className="relative block h-auto w-full"
          role="group"
          aria-label="Stylised map of Karachi neighbourhoods"
        >
          {/* Arabian Sea */}
          <path
            d="M 0 425 C 140 408 260 442 420 432 C 580 422 700 448 900 428 L 900 520 L 0 520 Z"
            className="fill-emerald-100/70"
          />
          <path
            d="M 0 425 C 140 408 260 442 420 432 C 580 422 700 448 900 428"
            fill="none"
            className="stroke-emerald-300/60"
            strokeWidth="1.5"
          />
          <text
            x="450"
            y="486"
            textAnchor="middle"
            className="fill-emerald-600/70 text-[15px] font-medium uppercase"
            style={{ letterSpacing: "0.35em" }}
          >
            Arabian Sea
          </text>

          {/* Roads */}
          {ROADS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              className="stroke-neutral-200"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="1 9"
            />
          ))}

          {/* District nodes */}
          {districts.map((d, i) => {
            const pos = PLACEMENTS[d.district];
            const r = radiusFor(d.count);
            const isHover = hovered === d.district;
            return (
              <g key={d.district} transform={`translate(${pos.x} ${pos.y})`}>
                <motion.g
                  initial={{ opacity: 0, scale: 0.4 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    type: "spring",
                    bounce: 0.35,
                    duration: 0.7,
                    delay: 0.15 + i * 0.06,
                  }}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  className="cursor-pointer"
                  onClick={() => goDistrict(d.district)}
                  onMouseEnter={() => setHovered(d.district)}
                  onMouseLeave={() => setHovered(null)}
                  role="button"
                  aria-label={`${d.district} — ${d.count} listings. Browse ${d.district} properties.`}
                >
                  {/* halo */}
                  <circle
                    r={r + (isHover ? 10 : 6)}
                    className="fill-emerald-500/10 transition-all duration-300"
                  />
                  <circle
                    r={r + 1.5}
                    fill="none"
                    className="stroke-white"
                    strokeWidth="3"
                  />
                  <circle r={r} className={cnNode(isHover)} strokeWidth={0} />
                  <text
                    y="4.5"
                    textAnchor="middle"
                    className="pointer-events-none fill-white text-[13px] font-semibold"
                  >
                    {d.count}
                  </text>
                  <text
                    y={r + 21}
                    textAnchor="middle"
                    className={cnLabel(isHover)}
                    stroke="#fafafa"
                    strokeWidth="4"
                    paintOrder="stroke"
                  >
                    {d.district}
                  </text>
                </motion.g>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredStat && hoveredPos && (
          <div
            className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 -translate-y-full rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-xl"
            style={{
              left: `${(hoveredPos.x / 900) * 100}%`,
              top: `calc(${(hoveredPos.y / 520) * 100}% - 34px)`,
            }}
            role="status"
          >
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-900">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              {hoveredStat.district}
            </p>
            <p className="mt-1 text-[12px] font-medium text-neutral-400">
              {hoveredStat.count} {hoveredStat.count === 1 ? "listing" : "listings"}
            </p>
            <div className="mt-2 space-y-1 border-t border-neutral-100 pt-2 text-[12px]">
              {hoveredStat.saleAvg > 0 && (
                <p className="flex justify-between gap-2">
                  <span className="text-neutral-400">Avg. sale</span>
                  <span className="font-semibold text-neutral-800">
                    {formatPKR(hoveredStat.saleAvg)}
                  </span>
                </p>
              )}
              {hoveredStat.rentAvg > 0 && (
                <p className="flex justify-between gap-2">
                  <span className="text-neutral-400">Avg. rent</span>
                  <span className="font-semibold text-neutral-800">
                    {formatPKR(hoveredStat.rentAvg, true)}
                  </span>
                </p>
              )}
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11.5px] font-semibold text-emerald-700">
              <TrendingUp className="h-3 w-3" />
              Click to browse homes
            </p>
          </div>
        )}
      </motion.div>

      {/* Quick chips (mobile-friendly alternative targets) */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {districts.map((d) => (
          <button
            key={d.district}
            onClick={() => goDistrict(d.district)}
            className="group flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-neutral-600 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
          >
            {d.district}
            <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-neutral-500 transition-colors group-hover:bg-white group-hover:text-emerald-700">
              {d.count}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function cnNode(isHover: boolean): string {
  return isHover ? "fill-emerald-600" : "fill-emerald-500/90";
}

function cnLabel(isHover: boolean): string {
  return isHover
    ? "pointer-events-none fill-emerald-800 text-[15px] font-semibold"
    : "pointer-events-none fill-neutral-600 text-[15px] font-medium transition-all";
}
