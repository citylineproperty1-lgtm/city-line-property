"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { AREAS, MARLA_SQFT, formatMinArea, type SizeUnit } from "@/lib/business";
import { CATEGORIES, PLOT_CATEGORY_SLUGS, categoryLabel, type CategoryDef, type Property } from "@/lib/types";
import { Search, SlidersHorizontal, X, SearchX, RotateCcw, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const PRICE_STEPS = [
  { value: "0", label: "All prices" },
  // Monthly rent scale (hero Rent filter lands here)
  { value: "25000", label: "25,000" },
  { value: "50000", label: "50,000" },
  { value: "75000", label: "75,000" },
  { value: "100000", label: "1 Lakh" },
  { value: "150000", label: "1.5 Lakh" },
  { value: "250000", label: "2.5 Lakh" },
  { value: "500000", label: "5 Lakh" },
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

  /* Size filter — uncontrolled input + ref; the store holds minArea in sqft.
     The effect only syncs the DOM when the store value was changed from
     outside (chip clear, reset, hero search landing), never while typing. */
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>("marla");
  const sizeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const el = sizeRef.current;
    if (!el) return;
    const n = Number(el.value);
    const current =
      el.value.trim() !== "" && !Number.isNaN(n) && n > 0
        ? sizeUnit === "marla"
          ? n * MARLA_SQFT
          : n
        : null;
    if (f.minArea !== current) {
      el.value =
        f.minArea == null
          ? ""
          : sizeUnit === "marla"
            ? String(+((f.minArea / MARLA_SQFT).toFixed(2)))
            : String(Math.round(f.minArea));
    }
  }, [f.minArea, sizeUnit]);

  const onSizeChange = () => {
    const el = sizeRef.current;
    if (!el) return;
    const n = Number(el.value);
    setFilters({
      minArea:
        el.value.trim() !== "" && !Number.isNaN(n) && n > 0
          ? sizeUnit === "marla"
            ? n * MARLA_SQFT
            : n
          : null,
    });
  };

  const switchSizeUnit = (next: SizeUnit) => {
    const el = sizeRef.current;
    const n = el ? Number(el.value) : NaN;
    if (el && el.value.trim() !== "" && !Number.isNaN(n) && n > 0) {
      const sqft = sizeUnit === "marla" ? n * MARLA_SQFT : n;
      const nextText = next === "marla" ? String(+(sqft / MARLA_SQFT).toFixed(2)) : String(Math.round(sqft));
      el.value = nextText;
      const num = Number(nextText);
      setFilters({ minArea: num > 0 ? (next === "marla" ? num * MARLA_SQFT : num) : null });
    }
    setSizeUnit(next);
  };

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
    if (f.minArea) p.set("minArea", String(Math.round(f.minArea)));
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

  // Known area name → that area; any other non-empty search text → manual
  // "Other area" mode; empty → ALL. `otherAreaMode` keeps the manual input
  // open right after picking "Other area" (search is still empty at that point).
  const [otherAreaMode, setOtherAreaMode] = useState(false);
  const activeArea = otherAreaMode
    ? "OTHER"
    : AREAS.find((a) => a === f.search) ?? (f.search.trim() ? "OTHER" : "ALL");

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
  if (f.minArea) chips.push({ label: formatMinArea(f.minArea), clear: () => setFilters({ minArea: null }) });

  const savedCount = favorites.length;

  return (
    <div className="mx-auto max-w-6xl bg-background px-4 py-10 sm:px-6 sm:py-14">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-foreground">
            Etihad Town &amp; enclaves
          </p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-foreground sm:text-4xl">
            Browse listings
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            {loading
              ? "Finding the right files…"
              : `${total} ${total === 1 ? "listing" : "listings"} available${
                  savedCount ? ` · ${savedCount} saved` : ""
                }`}
          </p>
        </div>
        {/* Sort */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={f.sort} onValueChange={(v) => setFilters({ sort: v })}>
            <SelectTrigger className="h-10 w-[190px] rounded-full border-border bg-card text-[13px] focus:ring-0">
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
      <div className="sticky top-16 z-30 mt-6 rounded-2xl border border-border bg-card/90 p-3 shadow-[0_10px_40px_-18px_rgba(15,23,42,0.25)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* search */}
          <form onSubmit={submitSearch} className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={f.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Search by area, society or keyword…"
              className="h-11 rounded-full border-border bg-muted pl-11 pr-10 text-sm focus-visible:ring-ring/40"
              aria-label="Search listings"
            />
            {f.search && (
              <button
                type="button"
                onClick={() => setFilters({ search: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* status segmented */}
            <div className="flex rounded-full bg-muted p-1">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() =>
                    setFilters({
                      status: t.value,
                      // Plots can't be rented — drop a selected plot category when switching to For Rent
                      ...(t.value === "RENT" && PLOT_CATEGORY_SLUGS.has(f.type) ? { type: "ALL" } : {}),
                    })
                  }
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[13px] font-medium transition-all",
                    f.status === t.value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={f.status === t.value}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* category */}
            <Select value={f.type} onValueChange={(v) => setFilters({ type: v })}>
              <SelectTrigger className="h-11 w-[150px] rounded-full border-border bg-card text-[13px] focus:ring-0" aria-label="Category">
                {f.type === "ALL" ? <span>Category</span> : <SelectValue placeholder="Category" />}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {cats
                  .filter(
                    (c) =>
                      c.slug !== "for-rent" && // rentals are picked via the For Rent tab
                      (f.status !== "RENT" || !PLOT_CATEGORY_SLUGS.has(c.slug)) // plots can't be rented
                  )
                  .map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* size — manual number + sqft / Marla unit (minimum area) */}
            <div
              className="flex h-11 items-center rounded-full border border-border bg-card"
              aria-label="Minimum size"
            >
              <Input
                ref={sizeRef}
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={f.minArea == null ? "" : String(+((f.minArea / MARLA_SQFT).toFixed(2)))}
                onChange={onSizeChange}
                placeholder="Size"
                aria-label="Minimum size — enter a number"
                className="h-full w-[76px] rounded-l-full border-0 bg-transparent px-4 text-[13px] focus-visible:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <Select value={sizeUnit} onValueChange={(v) => switchSizeUnit(v as SizeUnit)}>
                <SelectTrigger
                  className="h-9 w-[86px] shrink-0 rounded-full border-0 bg-muted px-3 text-[12px] focus:ring-0"
                  aria-label="Size unit"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">sqft</SelectItem>
                  <SelectItem value="marla">Marla</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* area */}
            <Select
              value={activeArea}
              onValueChange={(v) => {
                setOtherAreaMode(v === "OTHER");
                setFilters({ search: v === "ALL" ? "" : v === "OTHER" ? f.search : v });
              }}
            >
              <SelectTrigger className="h-11 w-[160px] rounded-full border-border bg-card text-[13px] focus:ring-0" aria-label="Area">
                {activeArea === "ALL" ? <span>Area</span> : activeArea === "OTHER" ? <span>Other area</span> : <SelectValue placeholder="Area" />}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All areas</SelectItem>
                {AREAS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
                <SelectItem value="OTHER">Other area — write your own</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(f.beds)}
              onValueChange={(v) => setFilters({ beds: Number(v) })}
            >
              <SelectTrigger className="h-11 w-[110px] rounded-full border-border bg-card text-[13px] focus:ring-0">
                {String(f.beds) === "0" ? <span>Beds</span> : <SelectValue placeholder="Beds" />}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All beds</SelectItem>
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
              <SelectTrigger className="h-11 w-[120px] rounded-full border-border bg-card text-[13px] focus:ring-0">
                {f.minPrice ?
                  (PRICE_STEPS.some((s) => s.value === String(f.minPrice)) ? (
                    <SelectValue placeholder="Min price" />
                  ) : (
                    <span className="truncate">Min: {formatPKR(f.minPrice).replace("PKR ", "")}</span>
                  )) : (
                    <span>Min price</span>
                  )}
              </SelectTrigger>
              <SelectContent>
                {PRICE_STEPS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.value === "0" ? "Min price" : `Min: ${s.label}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={f.maxPrice ? String(f.maxPrice) : "0"}
              onValueChange={(v) => setFilters({ maxPrice: Number(v) || null })}
            >
              <SelectTrigger className="h-11 w-[120px] rounded-full border-border bg-card text-[13px] focus:ring-0">
                {f.maxPrice ?
                  (PRICE_STEPS.some((s) => s.value === String(f.maxPrice)) ? (
                    <SelectValue placeholder="Max price" />
                  ) : (
                    <span className="truncate">Max: {formatPKR(f.maxPrice).replace("PKR ", "")}</span>
                  )) : (
                    <span>Max price</span>
                  )}
              </SelectTrigger>
              <SelectContent>
                {PRICE_STEPS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.value === "0" ? "Max price" : `Max: ${s.label}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Manual area — free text when "Other area" is picked (filters live) */}
        {activeArea === "OTHER" && (
          <div className="mt-3 flex items-center gap-2.5 rounded-full border border-border bg-muted px-4">
            <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <Input
              value={f.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Write the area — e.g. Block C, Phase 2"
              aria-label="Write your area"
              autoComplete="off"
              autoFocus
              className="h-10 flex-1 rounded-full border-0 bg-transparent px-0 text-[13px] shadow-none focus-visible:ring-0"
            />
            {f.search && (
              <button
                type="button"
                onClick={() => setFilters({ search: "" })}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                aria-label="Clear written area"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* active chips */}
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {chips.map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent py-1 pl-3 pr-1.5 text-[12px] font-medium text-accent-foreground ring-1 ring-ring/20"
              >
                {c.label}
                <button
                  onClick={c.clear}
                  className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/25"
                  aria-label={`Remove filter ${c.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={resetFilters}
              className="ml-1 inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {error ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-border bg-card py-10 text-center sm:py-16">
          <SearchX className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-[15px] font-medium text-foreground">{error}</p>
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
          className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-primary/30 bg-accent/40 py-12 text-center sm:py-20"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-border">
            <SearchX className="h-6 w-6 text-muted-foreground" />
          </span>
          <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
            No matches in our five areas
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Try widening your price range, removing a filter, or searching another
            area — or just tell us what you need and we&rsquo;ll hunt it down for you.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => {
                setOtherAreaMode(false);
                resetFilters();
              }}
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
              className="h-11 rounded-full border-border bg-card px-6 text-sm font-medium"
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
              <p className="text-[12.5px] text-muted-foreground">
                Showing {properties.length} of {total}
              </p>
              <Button
                onClick={loadMore}
                disabled={loadingMore}
                variant="outline"
                className="h-11 rounded-full border-border bg-card px-8 text-sm font-medium hover:bg-accent"
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
