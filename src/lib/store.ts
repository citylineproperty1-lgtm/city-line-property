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
  | { name: "compare" };

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

interface AppState {
  view: View;
  listingsFilters: ListingsFilters;
  favorites: string[];
  compare: string[];
  recent: string[];
  navigate: (view: View) => void;
  setFilters: (f: Partial<ListingsFilters>) => void;
  resetFilters: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleCompare: (id: string) => boolean; // returns true if added
  clearCompare: () => void;
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
      navigate: (view) => {
        set({ view });
        if (typeof window !== "undefined") {
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
      }),
    }
  )
);
