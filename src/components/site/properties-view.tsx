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
import { AREAS } from "@/lib/business";
import { CATEGORIES, categoryLabel, type CategoryDef, type Property } from "@/lib/types";
import { Search, SlidersHorizontal, X, SearchX, RotateCcw, Loader2 } from "lucide-react";
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

const PAGE_SIZE = 9;

export function PropertiesView() {
  const { listingsFilters: f, setFilters, resetFilters, favorites } = useAppStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cats, setCats] = useState<CategoryDef[]>(CATEGORIES);

  useEffect(() => {
    let alive = true;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const list: CategoryDef[] = d.categories ?? [];
        if (list.length) setCats(list);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

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
    fetch(`/api/properties?${query}&limit=${PAGE_SIZE}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((d) => {
        setProperties(d.properties ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => setError("Could not load properties. Please try again."))
      .finally(() => setLoading(false));
  }, [query]);

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    fetch(`/api/properties?${query}&limit=${PAGE_SIZE}&offset=${properties.length}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((d) => {
        setProperties((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...(d.properties ?? []).filter((p: Property) => !seen.has(p.id))];
        });
        setTotal(d.total ?? 0);
      })
      .catch(() => setError("Could not load more properties."))
      .finally(() => setLoadingMore(false));
  }, [query, properties.length]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const activeArea = AREAS.find((a) => a === f.search) ?? "ALL";

  const chips: { label: string; clear: () => void }[] = [];
  if (f.search) chips.push({ label: `"${f.search}"`, clear: () => setFilters({ search: "" }) });
  if (f.type !== "ALL")
    chips.push({
      label: categoryLabel(f.type),
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
    <div className="mx-auto max-w-6xl bg-background px-4 py-10 sm:px-6 sm:py-14">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0B6B5D]">
            Etihad Town &amp; enclaves
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Browse listings
          </h1>
          <p className="mt-2 text-[15px] text-neutral-500">
            {loading
              ? "Finding the right files…"
              : `${total} ${total === 1 ? "listing" : "listings"} available${
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
      <div className="sticky top-16 z-30 mt-6 rounded-2xl border border-black/[0.07] bg-white/90 p-3 shadow-[0_10px_40px_-18px_rgba(15,23,42,0.25)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* search */}
          <form onSubmit={submitSearch} className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={f.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Search by area, society or keyword…"
              className="h-11 rounded-full border-neutral-200 bg-neutral-50 pl-11 pr-10 text-sm focus-visible:ring-[#0F766E]/40"
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

            {/* category */}
            <Select value={f.type} onValueChange={(v) => setFilters({ type: v })}>
              <SelectTrigger className="h-11 w-[150px] rounded-full border-neutral-200 bg-white text-[13px] focus:ring-0">
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

            {/* area */}
            <Select value={activeArea} onValueChange={(v) => setFilters({ search: v === "ALL" ? "" : v })}>
              <SelectTrigger className="h-11 w-[160px] rounded-full border-neutral-200 bg-white text-[13px] focus:ring-0">
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All areas</SelectItem>
                {AREAS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
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
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F4F0] py-1 pl-3 pr-1.5 text-[12px] font-medium text-[#0B6B5D] ring-1 ring-[#0F766E]/20"
              >
                {c.label}
                <button
                  onClick={c.clear}
                  className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#0F766E]/10 transition-colors hover:bg-[#0F766E]/25"
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
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-black/[0.07] bg-white py-16 text-center">
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
          className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-[#0F766E]/30 bg-[#E7F4F0]/40 py-20 text-center"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06]">
            <SearchX className="h-6 w-6 text-neutral-400" />
          </span>
          <h3 className="mt-5 text-lg font-semibold tracking-tight text-neutral-900">
            No matches in our five areas
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
            Try widening your price range, removing a filter, or searching another
            area — or just tell us what you need and we&rsquo;ll hunt it down for you.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={resetFilters}
              className="brand-gradient h-11 rounded-full px-6 text-sm font-medium text-white shadow-[0_6px_16px_-6px_rgba(15,118,110,0.65)] hover:opacity-95"
            >
              Clear all filters
            </Button>
            <Button
              onClick={() => {
                resetFilters();
                useAppStore.getState().navigate({ name: "contact" });
              }}
              variant="outline"
              className="h-11 rounded-full border-neutral-200 bg-white px-6 text-sm font-medium"
            >
              Post a requirement
            </Button>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>

          {/* Load more */}
          {properties.length < total && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="text-[12.5px] text-neutral-400">
                Showing {properties.length} of {total}
              </p>
              <Button
                onClick={loadMore}
                disabled={loadingMore}
                variant="outline"
                className="h-11 rounded-full border-neutral-200 bg-white px-8 text-sm font-medium hover:bg-neutral-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load more properties"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
