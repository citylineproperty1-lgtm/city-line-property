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

export function viewToHash(v: View): string {
  switch (v.name) {
    case "home":
      return "#/";
    case "property":
      return `#/property/${v.id}`;
    case "agent":
      return `#/agent/${v.id}`;
    default:
      return `#/${v.name}`;
  }
}

export function hashToView(hash: string): View | null {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
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
          const target = viewToHash(view);
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
