"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { categoryLabel } from "@/lib/types";

/** City Line Property — global client store (view router + shortlist + alerts). */
export type View =
  | { name: "home" }
  | { name: "properties" }
  | { name: "property"; id: string }
  | { name: "agent"; id: string }
  | { name: "about" }
  | { name: "contact" }
  | { name: "saved" }
  | { name: "compare" }
  | { name: "insights" }
  | { name: "digest"; slug?: string }
  | { name: "areas" }
  | { name: "area"; slug: string }
  | { name: "admin" };

export type Currency = "PKR" | "USD";

export interface SavedSearch {
  id: string;
  filters: ListingsFiltersSnapshot;
  createdAt: number;
  /** Property ids already seen by the visitor — drives the "new matches" badge. */
  seenIds: string[];
}

/** The meaningful part of ListingsFilters that defines a search. */
export interface ListingsFiltersSnapshot {
  search: string;
  status: string;
  type: string;
  beds: number;
  minPrice: number | null;
  maxPrice: number | null;
}

interface ListingsFilters {
  search: string;
  status: string; // ALL | SALE | RENT
  type: string; // ALL | type
  beds: number; // 0 = any
  minPrice: number | null;
  maxPrice: number | null;
  sort: string; // newest | price-asc | price-desc | area-desc
}

export const MAX_COMPARE = 4;

/* ---------- Hash router helpers (shareable deep links) ---------- */

/** Serialize non-default listing filters to a readable query string. */
function filtersToQuery(f: ListingsFilters): string {
  const p = new URLSearchParams();
  if (f.search) p.set("q", f.search);
  if (f.status !== "ALL") p.set("status", f.status.toLowerCase());
  if (f.type !== "ALL") p.set("type", f.type);
  if (f.beds > 0) p.set("beds", String(f.beds));
  if (f.minPrice != null) p.set("min", String(f.minPrice));
  if (f.maxPrice != null) p.set("max", String(f.maxPrice));
  if (f.sort !== "newest") p.set("sort", f.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Parse a properties hash query back into filter values (null if none). */
export function filtersFromHash(hash: string): Partial<ListingsFilters> | null {
  const qIndex = hash.indexOf("?");
  if (qIndex === -1) return null;
  const head = hash.replace(/^#\/?/, "").split("/")[0]?.split("?")[0];
  if (head !== "properties") return null;
  const p = new URLSearchParams(hash.slice(qIndex + 1));
  const f: Partial<ListingsFilters> = {};
  const q = p.get("q");
  if (q) f.search = q;
  const status = p.get("status");
  if (status === "sale" || status === "rent") f.status = status.toUpperCase();
  const type = p.get("type");
  if (type && /^[a-z0-9-]+$/i.test(type)) f.type = type.toLowerCase();
  const beds = p.get("beds");
  if (beds && /^\d+$/.test(beds)) f.beds = Number(beds);
  const min = p.get("min");
  if (min && /^\d+$/.test(min)) f.minPrice = Number(min);
  const max = p.get("max");
  if (max && /^\d+$/.test(max)) f.maxPrice = Number(max);
  const sort = p.get("sort");
  if (sort && /^[a-z-]+$/.test(sort)) f.sort = sort;
  return Object.keys(f).length > 0 ? f : null;
}

export function viewToHash(v: View, filters?: ListingsFilters): string {
  switch (v.name) {
    case "home":
      return "#/";
    case "property":
      return `#/property/${v.id}`;
    case "agent":
      return `#/agent/${v.id}`;
    case "digest":
      return v.slug ? `#/digest/${v.slug}` : "#/digest";
    case "area":
      return `#/areas/${v.slug}`;
    case "properties":
      return `#/properties${filters ? filtersToQuery(filters) : ""}`;
    default:
      return `#/${v.name}`;
  }
}

export function hashToView(hash: string): View | null {
  const clean = hash.split("?")[0];
  const parts = clean.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts.length === 0) return { name: "home" };
  const [head, id] = parts;
  switch (head) {
    case "properties":
    case "about":
    case "contact":
    case "saved":
    case "compare":
    case "insights":
    case "admin":
      return { name: head } as View;
    case "digest":
      return { name: "digest", slug: id || undefined } as View;
    case "areas":
      return id ? { name: "area", slug: id } as View : { name: "areas" };
    case "property":
      return id ? { name: "property", id } : null;
    case "agent":
      return id ? { name: "agent", id } : null;
    default:
      return null;
  }
}

export function sameView(a: View, b: View): boolean {
  if (a.name !== b.name) return false;
  if (a.name === "property") return a.id === (b as { id: string }).id;
  if (a.name === "agent") return a.id === (b as { id: string }).id;
  if (a.name === "digest")
    return (a.slug ?? undefined) === ((b as { slug?: string }).slug ?? undefined);
  if (a.name === "area") return a.slug === (b as { slug: string }).slug;
  return true;
}

interface AppState {
  view: View;
  listingsFilters: ListingsFilters;
  favorites: string[];
  compare: string[];
  recent: string[];
  savedSearches: SavedSearch[];
  currency: Currency;
  paletteOpen: boolean;
  navigate: (view: View) => void;
  setPalette: (open: boolean) => void;
  toggleCurrency: () => Currency;
  setFilters: (f: Partial<ListingsFilters>) => void;
  resetFilters: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleCompare: (id: string) => boolean; // returns true if added
  clearCompare: () => void;
  startCompare: (ids: string[]) => void;
  recordRecent: (id: string) => void;
  saveSearch: () => boolean; // false when the same search is already saved
  removeSearch: (id: string) => void;
  markSearchSeen: (id: string, ids: string[]) => void;
}

const defaultFilters: ListingsFilters = {
  search: "",
  status: "ALL",
  type: "ALL",
  beds: 0,
  minPrice: null,
  maxPrice: null,
  sort: "newest",
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: { name: "home" },
      listingsFilters: defaultFilters,
      favorites: [],
      compare: [],
      recent: [],
      savedSearches: [],
      currency: "PKR",
      paletteOpen: false,
      setPalette: (open) => set({ paletteOpen: open }),
      toggleCurrency: () => {
        const next: Currency = get().currency === "PKR" ? "USD" : "PKR";
        set({ currency: next });
        return next;
      },
      navigate: (view) => {
        set({ view });
        if (typeof window !== "undefined") {
          const target =
            view.name === "properties"
              ? viewToHash(view, get().listingsFilters)
              : viewToHash(view);
          if (window.location.hash !== target) {
            history.pushState(null, "", target);
          }
          window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        }
      },
      setFilters: (f) =>
        set((s) => ({ listingsFilters: { ...s.listingsFilters, ...f } })),
      resetFilters: () => set({ listingsFilters: defaultFilters }),
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),
      isFavorite: (id) => get().favorites.includes(id),
      toggleCompare: (id) => {
        const { compare } = get();
        if (compare.includes(id)) {
          set({ compare: compare.filter((c) => c !== id) });
          return false;
        }
        if (compare.length >= MAX_COMPARE) return false;
        set({ compare: [...compare, id] });
        return true;
      },
      clearCompare: () => set({ compare: [] }),
      startCompare: (ids) => set({ compare: ids.slice(0, MAX_COMPARE) }),
      recordRecent: (id) =>
        set((s) => ({
          recent: [id, ...s.recent.filter((r) => r !== id)].slice(0, 8),
        })),
      saveSearch: () => {
        const f = get().listingsFilters;
        const snapshot: ListingsFiltersSnapshot = {
          search: f.search,
          status: f.status,
          type: f.type,
          beds: f.beds,
          minPrice: f.minPrice,
          maxPrice: f.maxPrice,
        };
        const exists = get().savedSearches.some(
          (s) =>
            s.filters.search === snapshot.search &&
            s.filters.status === snapshot.status &&
            s.filters.type === snapshot.type &&
            s.filters.beds === snapshot.beds &&
            s.filters.minPrice === snapshot.minPrice &&
            s.filters.maxPrice === snapshot.maxPrice
        );
        if (exists) return false;
        const entry: SavedSearch = {
          id: `srch_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          filters: snapshot,
          createdAt: Date.now(),
          seenIds: [],
        };
        set((s) => ({ savedSearches: [entry, ...s.savedSearches].slice(0, 8) }));
        return true;
      },
      removeSearch: (id) =>
        set((s) => ({ savedSearches: s.savedSearches.filter((x) => x.id !== id) })),
      markSearchSeen: (id, ids) =>
        set((s) => ({
          savedSearches: s.savedSearches.map((x) =>
            x.id === id ? { ...x, seenIds: ids } : x
          ),
        })),
    }),
    {
      name: "city-line-property",
      partialize: (s) => ({
        favorites: s.favorites,
        compare: s.compare,
        recent: s.recent,
        savedSearches: s.savedSearches,
        currency: s.currency,
      }),
    }
  )
);

/* ------------------------- Saved-search helpers -------------------------- */

/** Human-readable label for a saved search, e.g. "Houses · For Sale · Phase 1". */
export function describeListingsFilters(f: ListingsFiltersSnapshot): string {
  const parts: string[] = [];
  if (f.type !== "ALL") parts.push(categoryLabel(f.type));
  if (f.status === "SALE") parts.push("For Sale");
  if (f.status === "RENT") parts.push("For Rent");
  if (f.beds > 0) parts.push(`${f.beds}+ beds`);
  if (f.search) parts.push(`“${f.search}”`);
  if (f.minPrice != null || f.maxPrice != null) {
    const lo = f.minPrice != null ? `${Math.round(f.minPrice / 100000) / 10}M` : null;
    const hi = f.maxPrice != null ? `${Math.round(f.maxPrice / 100000) / 10}M` : null;
    parts.push(lo && hi ? `${lo}–${hi} PKR` : lo ? `from ${lo} PKR` : `up to ${hi} PKR`);
  }
  return parts.length ? parts.join(" · ") : "All listings";
}

/** Build the public /api/properties query for a saved search (no sort). */
export function savedSearchQuery(f: ListingsFiltersSnapshot): string {
  const p = new URLSearchParams();
  if (f.search) p.set("search", f.search);
  if (f.status !== "ALL") p.set("status", f.status);
  if (f.type !== "ALL") p.set("type", f.type);
  if (f.beds > 0) p.set("beds", String(f.beds));
  if (f.minPrice != null) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice != null) p.set("maxPrice", String(f.maxPrice));
  return p.toString();
}
