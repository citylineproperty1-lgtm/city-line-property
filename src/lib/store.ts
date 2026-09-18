"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  | { name: "admin" };

export type Currency = "PKR" | "USD";

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
  if (f.type !== "ALL") p.set("type", f.type.toLowerCase());
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
  if (type) f.type = type.toUpperCase();
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
  return true;
}

interface AppState {
  view: View;
  listingsFilters: ListingsFilters;
  favorites: string[];
  compare: string[];
  recent: string[];
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
    }),
    {
      name: "city-line-property",
      partialize: (s) => ({
        favorites: s.favorites,
        compare: s.compare,
        recent: s.recent,
        currency: s.currency,
      }),
    }
  )
);
