"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/site/animated-number";
import { TrafficChart, type DayPoint } from "@/components/site/traffic-chart";
import { useAppStore } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { categoryLabel } from "@/lib/types";
import {
  TrendingUp,
  Home,
  KeyRound,
  Ruler,
  Star,
  Eye,
  MapPin,
  Info,
  LineChart,
  BedDouble,
  Bath,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Insights {
  total: number;
  saleCount: number;
  rentCount: number;
  avgSalePrice: number;
  avgRent: number;
  avgPricePerSqft: number;
  avgArea: number;
  avgRating: number;
  byDistrict: { district: string; count: number; saleAvg: number; rentAvg: number }[];
  typeMix: { type: string; count: number }[];
  mostViewed: {
    id: string;
    title: string;
    district: string;
    price: number;
    status: string;
    views: number;
    beds: number;
    baths: number;
    image: string;
  }[];
  viewsByDay: DayPoint[];
  viewsLast7: number;
  weekDelta: number;
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const BAR_COLORS = ["bg-[#34C759]", "bg-[#FF9500]", "bg-[#30B0C7]", "bg-[#AF52DE]", "bg-[#FF2D55]", "bg-[#007AFF]", "bg-[#A2845E]"];

export function InsightsView() {
  const { navigate } = useAppStore();
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/insights")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setData(d.insights ?? null);
      })
      .catch(() => {
        if (alive) setData(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Skeleton className="h-10 w-72 rounded-full" />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-8 h-72 rounded-3xl" />
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <LineChart className="mx-auto h-10 w-10 text-neutral-300" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">No market data yet</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Insights appear once listings are live on the platform.
        </p>
      </div>
    );
  }

  const maxSale = Math.max(...data.byDistrict.map((d) => d.saleAvg), 1);
  const typeTotal = data.typeMix.reduce((a, b) => a + b.count, 0);
  const maxViews = Math.max(...data.mostViewed.map((m) => m.views), 1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Header */}
      <motion.div {...fadeUp} className="max-w-2xl">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider text-[#A8851D]">
          <LineChart className="h-4 w-4" />
          Etihad Town · Lahore market
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Market insights
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-500">
          Live numbers computed straight from our listings — average prices, rent
          levels and what buyers are looking at right now across the city.
        </p>
      </motion.div>

      {/* KPI cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            icon: Home,
            label: "Average sale price",
            value: formatPKR(data.avgSalePrice),
            sub: `${data.saleCount} homes for sale`,
          },
          {
            icon: KeyRound,
            label: "Average monthly rent",
            value: formatPKR(data.avgRent, true),
            sub: `${data.rentCount} homes for rent`,
          },
          {
            icon: TrendingUp,
            label: "Avg. price / sqft (sale)",
            value: `PKR ${data.avgPricePerSqft.toLocaleString()}`,
            sub: `avg. home is ${data.avgArea.toLocaleString()} sqft`,
          },
          {
            icon: Star,
            label: "Average listing rating",
            value: data.avgRating.toFixed(1),
            sub: `${data.total} live listings`,
          },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.05 }}
            className="rounded-2xl border border-neutral-200/80 bg-white p-5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E9CE7A] to-[#A8851D] text-white">
              <k.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-xl font-semibold tracking-tight text-neutral-900">
              {k.value}
            </p>
            <p className="mt-0.5 text-[12.5px] font-medium text-neutral-500">{k.label}</p>
            <p className="text-[11.5px] text-neutral-400">{k.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* District chart */}
        <motion.section {...fadeUp} className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                Average sale price by district
              </h2>
              <p className="mt-1 text-[13px] text-neutral-400">
                Rent shown where the district has rental stock
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-5">
            {data.byDistrict.map((d, i) => (
              <div key={d.district}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-[13.5px] font-medium text-neutral-700">
                    <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                    {d.district}
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10.5px] font-semibold text-neutral-500">
                      {d.count}
                    </span>
                  </p>
                  <p className="text-[13px] font-semibold tabular-nums text-neutral-900">
                    {d.saleAvg > 0 ? formatPKR(d.saleAvg) : "—"}
                    {d.rentAvg > 0 && (
                      <span className="ml-2 text-[11.5px] font-normal text-[#8C6D1F]">
                        rent {formatPKR(d.rentAvg, true)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-neutral-100">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.max((d.saleAvg / maxSale) * 100, 3)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.07, ease: "easeOut" }}
                    className={cn("h-full rounded-full", i === 0 ? "bg-[#F7EFD4]0" : "bg-neutral-800")}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <div className="flex flex-col gap-8">
          {/* Listing mix */}
          <motion.section {...fadeUp} className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
              Listing mix
            </h2>
            <p className="mt-1 text-[13px] text-neutral-400">What&rsquo;s on the platform</p>
            {/* stacked bar */}
            <div className="mt-5 flex h-3.5 w-full overflow-hidden rounded-full bg-neutral-100">
              {data.typeMix.map((t, i) => (
                <motion.div
                  key={t.type}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.08 }}
                  style={{ width: `${(t.count / typeTotal) * 100}%` }}
                  className={cn("h-full origin-left", BAR_COLORS[i % BAR_COLORS.length])}
                  title={`${categoryLabel(t.type)}: ${t.count}`}
                />
              ))}
            </div>
            <ul className="mt-5 space-y-2.5">
              {data.typeMix.map((t, i) => (
                <li key={t.type} className="flex items-center gap-2.5 text-[13px]">
                  <span className={cn("h-2.5 w-2.5 rounded-full", BAR_COLORS[i % BAR_COLORS.length])} />
                  <span className="font-medium text-neutral-700">
                    {categoryLabel(t.type)}
                  </span>
                  <span className="ml-auto tabular-nums text-neutral-400">
                    {t.count} · {Math.round((t.count / typeTotal) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* Sale vs rent */}
          <motion.section {...fadeUp} className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
              Sale vs rent
            </h2>
            <div className="mt-5 flex items-end gap-6">
              <div className="flex-1">
                <p className="text-2xl font-semibold tracking-tight text-neutral-900">
                  <AnimatedNumber value={data.saleCount} />
                </p>
                <p className="text-[12.5px] text-neutral-500">for sale</p>
              </div>
              <div className="h-12 w-px bg-neutral-200" />
              <div className="flex-1">
                <p className="text-2xl font-semibold tracking-tight text-[#8C6D1F]">
                  <AnimatedNumber value={data.rentCount} />
                </p>
                <p className="text-[12.5px] text-neutral-500">for rent</p>
              </div>
            </div>
            <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: data.saleCount / data.total }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{ width: `${(data.saleCount / data.total) * 100}%` }}
                className="h-full origin-left bg-neutral-800"
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-neutral-400">
              <span>{Math.round((data.saleCount / data.total) * 100)}% sale</span>
              <span>{Math.round((data.rentCount / data.total) * 100)}% rent</span>
            </div>
          </motion.section>
        </div>
      </div>

      {/* Traffic */}
      <motion.section {...fadeUp} className="mt-8 rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Traffic</h2>
            <p className="mt-1 text-[13px] text-neutral-400">
              Listing views over the last 14 days, updated live
            </p>
          </div>
          <Eye className="h-5 w-5 shrink-0 text-neutral-300" />
        </div>
        <div className="mt-5">
          <TrafficChart data={data.viewsByDay} last7={data.viewsLast7} delta={data.weekDelta} />
        </div>
      </motion.section>

      {/* Most viewed */}
      <motion.section {...fadeUp} className="mt-8 rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
              Most viewed this week
            </h2>
            <p className="mt-1 text-[13px] text-neutral-400">
              Where everyone is looking — ranked by listing views
            </p>
          </div>
          <Eye className="h-5 w-5 text-neutral-300" />
        </div>
        <ol className="mt-6 space-y-3">
          {data.mostViewed.map((m, i) => (
            <motion.li key={m.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }}>
              <button
                onClick={() => navigate({ name: "property", id: m.id })}
                className="group flex w-full items-center gap-4 rounded-2xl border border-neutral-100 p-3 text-left transition-all hover:border-neutral-200 hover:bg-neutral-50/60"
              >
                <span className="w-6 shrink-0 text-center text-lg font-semibold tabular-nums text-neutral-300">
                  {i + 1}
                </span>
                <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  {m.image && (
                    <Image src={m.image} alt="" fill sizes="80px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-neutral-900 group-hover:text-[#8C6D1F]">
                    {m.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-3 text-[12px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {m.district}
                    </span>
                    {m.beds > 0 && (
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3 w-3" />
                        {m.beds}
                      </span>
                    )}
                    {m.baths > 0 && (
                      <span className="flex items-center gap-1">
                        <Bath className="h-3 w-3" />
                        {m.baths}
                      </span>
                    )}
                  </span>
                </span>
                <span className="hidden shrink-0 text-right sm:block">
                  <span className="block text-[13.5px] font-semibold text-neutral-900">
                    {formatPKR(m.price, m.status === "RENT")}
                  </span>
                  <span className="mt-0.5 flex items-center justify-end gap-1 text-[11.5px] text-neutral-400">
                    <Eye className="h-3 w-3" />
                    {m.views.toLocaleString()} views
                  </span>
                </span>
                {/* view popularity bar */}
                <span className="hidden w-24 shrink-0 lg:block">
                  <span className="block h-1.5 overflow-hidden rounded-full bg-neutral-100">
                    <span
                      className="block h-full rounded-full bg-amber-400"
                      style={{ width: `${Math.max((m.views / maxViews) * 100, 8)}%` }}
                    />
                  </span>
                </span>
              </button>
            </motion.li>
          ))}
        </ol>
      </motion.section>

      {/* Methodology note */}
      <p className="mx-auto mt-8 flex max-w-2xl items-start justify-center gap-2 text-center text-[12px] leading-relaxed text-neutral-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Averages are computed live from listings currently on the platform and shift
        as new homes are added. They are indicative of asking prices, not
        transacted values.
      </p>
    </div>
  );
}
