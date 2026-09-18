"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type View =
  | { name: "home" }
  | { name: "properties" }
  | { name: "property"; id: string }
  | { name: "about" }
  | { name: "contact" }
  | { name: "saved" };

interface ListingsFilters {
  search: string;
  status: string; // ALL | SALE | RENT
  type: string; // ALL | type
  beds: number; // 0 = any
  minPrice: number | null;
  maxPrice: number | null;
  sort: string; // newest | price-asc | price-desc | area-desc
}

interface AppState {
  view: View;
  listingsFilters: ListingsFilters;
  favorites: string[];
  navigate: (view: View) => void;
  setFilters: (f: Partial<ListingsFilters>) => void;
  resetFilters: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
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
    }),
    {
      name: "city-line-property",
      partialize: (s) => ({ favorites: s.favorites }),
    }
  )
);
