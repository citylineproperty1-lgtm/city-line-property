"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useAppStore } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { PROPERTY_TYPES, type Property } from "@/lib/types";
import { Search, SlidersHorizontal, X, SearchX, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const PRICE_STEPS = [
  { value: "0", label: "Any" },
  { value: "1000000", label: "10 Lakh" },
  { value: "2500000", label: "25 Lakh" },
  { value: "5000000", label: "50 Lakh" },
  { value: "10000000", label: "1 Crore" },
  { value: "25000000", label: "2.5 Crore" },
  { value: "50000000", label: "5 Crore" },
  { value: "100000000", label: "10 Crore" },
  { value: "500000000", label: "50 Crore" },
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "area-desc", label: "Largest first" },
];

const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "SALE", label: "For Sale" },
  { value: "RENT", label: "For Rent" },
];

export function PropertiesView() {
  const { listingsFilters: f, setFilters, resetFilters, favorites } = useAppStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (f.search) p.set("search", f.search);
    if (f.status !== "ALL") p.set("status", f.status);
    if (f.type !== "ALL") p.set("type", f.type);
    if (f.beds > 0) p.set("beds", String(f.beds));
    if (f.minPrice) p.set("minPrice", String(f.minPrice));
    if (f.maxPrice) p.set("maxPrice", String(f.maxPrice));
    p.set("sort", f.sort);
    return p.toString();
  }, [f]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/properties?${query}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((d) => setProperties(d.properties ?? []))
      .catch(() => setError("Could not load properties. Please try again."))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const chips: { label: string; clear: () => void }[] = [];
  if (f.search) chips.push({ label: `"${f.search}"`, clear: () => setFilters({ search: "" }) });
  if (f.type !== "ALL")
    chips.push({
      label: PROPERTY_TYPES.find((t) => t.value === f.type)?.label ?? f.type,
      clear: () => setFilters({ type: "ALL" }),
    });
  if (f.beds > 0) chips.push({ label: `${f.beds}+ beds`, clear: () => setFilters({ beds: 0 }) });
  if (f.minPrice)
    chips.push({
      label: `Min ${formatPKR(f.minPrice).replace("PKR ", "")}`,
      clear: () => setFilters({ minPrice: null }),
    });
  if (f.maxPrice)
    chips.push({
      label: `Max ${formatPKR(f.maxPrice).replace("PKR ", "")}`,
      clear: () => setFilters({ maxPrice: null }),
    });

  const savedCount = favorites.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Browse properties
          </h1>
          <p className="mt-2 text-[15px] text-neutral-500">
            {loading
              ? "Finding the right homes…"
              : `${properties.length} ${properties.length === 1 ? "listing" : "listings"} available${
                  savedCount ? ` · ${savedCount} saved` : ""
                }`}
          </p>
        </div>
        {/* Sort */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-neutral-400" />
          <Select value={f.sort} onValueChange={(v) => setFilters({ sort: v })}>
            <SelectTrigger className="h-10 w-[190px] rounded-full border-neutral-200 bg-white text-[13px] focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-16 z-30 mt-6 rounded-2xl border border-neutral-200/80 bg-white/90 p-3 shadow-[0_10px_40px_-18px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* search */}
          <form onSubmit={submitSearch} className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={f.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Search by area, city or keyword…"
              className="h-11 rounded-full border-neutral-200 bg-neutral-50 pl-11 pr-10 text-sm focus-visible:ring-neutral-300"
              aria-label="Search listings"
            />
            {f.search && (
              <button
                type="button"
                onClick={() => setFilters({ search: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:bg-neutral-200/60 hover:text-neutral-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* status segmented */}
            <div className="flex rounded-full bg-neutral-100 p-1">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setFilters({ status: t.value })}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[13px] font-medium transition-all",
                    f.status === t.value
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-800"
                  )}
                  aria-pressed={f.status === t.value}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <Select value={f.type} onValueChange={(v) => setFilters({ type: v })}>
              <SelectTrigger className="h-11 w-[130px] rounded-full border-neutral-200 bg-white text-[13px] focus:ring-0">
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

            <Select
              value={String(f.beds)}
              onValueChange={(v) => setFilters({ beds: Number(v) })}
            >
              <SelectTrigger className="h-11 w-[110px] rounded-full border-neutral-200 bg-white text-[13px] focus:ring-0">
                <SelectValue placeholder="Beds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any beds</SelectItem>
                {[1, 2, 3, 4, 5, 6].map((b) => (
                  <SelectItem key={b} value={String(b)}>
                    {b}+ beds
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={f.minPrice ? String(f.minPrice) : "0"}
              onValueChange={(v) => setFilters({ minPrice: Number(v) || null })}
            >
              <SelectTrigger className="h-11 w-[120px] rounded-full border-neutral-200 bg-white text-[13px] focus:ring-0">
                <SelectValue placeholder="Min price" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_STEPS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.value === "0" ? "Min: Any" : `Min: ${s.label}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={f.maxPrice ? String(f.maxPrice) : "0"}
              onValueChange={(v) => setFilters({ maxPrice: Number(v) || null })}
            >
              <SelectTrigger className="h-11 w-[120px] rounded-full border-neutral-200 bg-white text-[13px] focus:ring-0">
                <SelectValue placeholder="Max price" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_STEPS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.value === "0" ? "Max: Any" : `Max: ${s.label}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* active chips */}
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
            {chips.map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 py-1 pl-3 pr-1.5 text-[12px] font-medium text-white"
              >
                {c.label}
                <button
                  onClick={c.clear}
                  className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/30"
                  aria-label={`Remove filter ${c.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={resetFilters}
              className="ml-1 inline-flex items-center gap-1 text-[12px] font-medium text-neutral-400 transition-colors hover:text-neutral-700"
            >
              <RotateCcw className="h-3 w-3" />
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {error ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-neutral-200 bg-white py-16 text-center">
          <SearchX className="h-10 w-10 text-neutral-300" />
          <p className="mt-4 text-[15px] font-medium text-neutral-700">{error}</p>
          <Button onClick={load} variant="outline" className="mt-5 h-10 rounded-full text-sm">
            Try again
          </Button>
        </div>
      ) : loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
            <SearchX className="h-6 w-6 text-neutral-400" />
          </span>
          <h3 className="mt-5 text-lg font-semibold tracking-tight text-neutral-900">
            No matches found
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
            Try widening your price range, removing a filter, or searching a
            different neighbourhood — new listings arrive weekly.
          </p>
          <Button
            onClick={resetFilters}
            className="mt-6 h-11 rounded-full bg-neutral-900 px-6 text-sm font-medium hover:bg-neutral-700"
          >
            Clear all filters
          </Button>
        </motion.div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
