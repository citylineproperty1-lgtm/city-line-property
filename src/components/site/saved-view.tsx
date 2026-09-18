"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertyCard, PropertyCardSkeleton } from "@/components/site/property-card";
import {
  useAppStore,
  describeListingsFilters,
  savedSearchQuery,
  type SavedSearch,
} from "@/lib/store";
import type { Property } from "@/lib/types";
import { formatPKR } from "@/lib/format";
import { BellRing, GitCompareArrows, ArrowUpDown, Heart, Search, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type SavedSort = "recent" | "price-asc" | "price-desc" | "area-desc" | "beds-desc";

const SORT_OPTIONS: { value: SavedSort; label: string }[] = [
  { value: "recent", label: "Recently saved" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "area-desc", label: "Largest first" },
  { value: "beds-desc", label: "Most bedrooms" },
];

type AlertStat = { total: number; fresh: number; ids: string[]; latestPrice: number | null };

export function SavedView() {
  const { favorites, navigate, startCompare, compare, savedSearches, removeSearch, markSearchSeen } =
    useAppStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SavedSort>("recent");
  const [alertStats, setAlertStats] = useState<Record<string, AlertStat>>({});

  useEffect(() => {
    const load = () => {
      if (favorites.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      fetch(`/api/properties?ids=${favorites.join(",")}`)
        .then((r) => r.json())
        .then((d) => setProperties(d.properties ?? []))
        .catch(() => setProperties([]))
        .finally(() => setLoading(false));
    };
    load();
  }, [favorites]);

  const byId = new Map(properties.map((p) => [p.id, p]));

  // Live match counts for each saved search (fires one lightweight request per
  // search; counts include everything published, like the listings grid).
  useEffect(() => {
    let alive = true;
    savedSearches.forEach((s) => {
      fetch(`/api/properties?${savedSearchQuery(s.filters)}&limit=60`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
        .then((d) => {
          if (!alive) return;
          const list: Property[] = d.properties ?? [];
          const ids = list.map((p) => p.id);
          const seen = new Set(s.seenIds);
          const fresh = ids.filter((id) => !seen.has(id)).length;
          const prices = list.map((p) => p.price);
          setAlertStats((prev) => ({
            ...prev,
            [s.id]: {
              total: list.length,
              fresh,
              ids,
              latestPrice: prices.length ? Math.min(...prices) : null,
            },
          }));
        })
        .catch(() => {});
    });
    return () => {
      alive = false;
    };
  }, [savedSearches.length]);

  const openSavedSearch = (s: SavedSearch) => {
    markSearchSeen(s.id, alertStats[s.id]?.ids ?? []);
    useAppStore.getState().resetFilters();
    useAppStore.getState().setFilters(s.filters);
    navigate({ name: "properties" });
  };

  const sorted: Property[] =
    sort === "recent"
      ? [...favorites].reverse().flatMap((id) => {
          const p = byId.get(id);
          return p ? [p] : [];
        })
      : [...properties].sort((a, b) => {
          if (sort === "price-asc") return a.price - b.price;
          if (sort === "price-desc") return b.price - a.price;
          if (sort === "area-desc") return b.area - a.area;
          return b.beds - a.beds;
        });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50">
          <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Saved properties
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {loading
              ? "Loading your shortlist…"
              : `${properties.length} ${properties.length === 1 ? "home" : "homes"} in your shortlist`}
          </p>
        </div>
      </div>

      {/* Search alerts */}
      {savedSearches.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mt-6 rounded-3xl border border-[#C9A227]/25 bg-[linear-gradient(135deg,rgba(233,206,122,0.14),rgba(201,162,39,0.06))] p-5 sm:p-6"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#DCB94F_0%,#C9A227_100%)] text-white shadow-[0_4px_12px_rgba(201,162,39,0.35)]">
              <BellRing className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">
                Search alerts
              </h2>
              <p className="text-[12px] text-neutral-500">
                We watch these searches — new matches are flagged the moment they appear.
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {savedSearches.map((s) => {
              const stat = alertStats[s.id];
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-black/[0.06] bg-white/85 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-neutral-800">
                      {describeListingsFilters(s.filters)}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-neutral-500">
                      {stat
                        ? `${stat.total} current match${stat.total === 1 ? "" : "es"}` +
                          (stat.latestPrice != null && stat.total > 0
                            ? ` · from ${formatPKR(stat.latestPrice)}`
                            : "")
                        : "Checking matches…"}
                    </p>
                  </div>
                  {stat && stat.fresh > 0 && (
                    <span className="rounded-full bg-[#C9A227] px-2.5 py-1 text-[10.5px] font-bold text-white shadow-sm">
                      {stat.fresh} new
                    </span>
                  )}
                  <button
                    onClick={() => openSavedSearch(s)}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-[#C9A227]/45 bg-white px-3.5 text-[12px] font-semibold text-[#8A7119] transition-colors hover:bg-[#C9A227]/10"
                  >
                    View matches
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      removeSearch(s.id);
                      toast.success("Alert removed");
                    }}
                    aria-label="Remove alert"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}

      {/* Compare shortcut */}
      {!loading && properties.length >= 2 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/60 px-5 py-4">
          <p className="text-[13.5px] text-neutral-600">
            Shortlisted {properties.length} homes? See them side by side — specs,
            prices and amenities in one table.
          </p>
          <button
            onClick={() => {
              const fresh = properties.filter((p) => !compare.includes(p.id)).map((p) => p.id);
              startCompare([...compare, ...fresh]);
              toast.success("Shortlist ready to compare");
              navigate({ name: "compare" });
            }}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-neutral-900 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-neutral-700"
          >
            <GitCompareArrows className="h-4 w-4" />
            Compare saved
          </button>
        </div>
      )}

      {!loading && properties.length > 1 && (
        <div className="mt-6 flex items-center justify-end gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />
          <Select value={sort} onValueChange={(v) => setSort(v as SavedSort)}>
            <SelectTrigger className="h-10 w-[190px] rounded-full border-neutral-200 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-[13px]">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/60 py-20 text-center"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
            <Heart className="h-6 w-6 text-neutral-300" />
          </span>
          <h3 className="mt-5 text-lg font-semibold tracking-tight text-neutral-900">
            Nothing saved yet
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
            Tap the heart on any property to keep it here — and save a search from
            the Listings page to get alerts when new matches arrive.
          </p>
          <Button
            onClick={() => navigate({ name: "properties" })}
            className="mt-6 h-11 rounded-full bg-neutral-900 px-6 text-sm font-medium hover:bg-neutral-700"
          >
            <Search className="h-4 w-4" />
            Explore properties
          </Button>
        </motion.div>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
