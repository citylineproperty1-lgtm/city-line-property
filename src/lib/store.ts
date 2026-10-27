"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { categoryLabel } from "@/lib/types";

/**
 * City Line Property — global client store.
 * SPA view router + listing filters + favorites. Currency is PKR-only.
 */
export type View =
  | { name: "home" }
  | { name: "properties" }
  | { name: "property"; id: string }
  | { name: "about" }
  | { name: "contact" }
  | { name: "saved" }
  | { name: "areas" }
  | { name: "area"; slug: string }
  | { name: "admin" };

interface ListingsFilters {
  search: string;
  status: string; // ALL | SALE | RENT
  type: string; // ALL | type
  beds: number; // 0 = any
  minPrice: number | null;
  maxPrice: number | null;
  minArea: number | null; // minimum size in sqft (marla inputs convert via MARLA_SQFT)
  sort: string; // newest | price-asc | price-desc | area-desc
}

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
  if (f.minArea != null) p.set("area", String(Math.round(f.minArea)));
  if (f.sort !== "newest") p.set("sort", f.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Parse a properties hash query back into filter values (null if none). */
function parseFilterParams(p: URLSearchParams): Partial<ListingsFilters> | null {
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
  const area = p.get("area");
  if (area && /^\d+$/.test(area)) f.minArea = Number(area);
  const sort = p.get("sort");
  if (sort && /^[a-z-]+$/.test(sort)) f.sort = sort;
  return Object.keys(f).length > 0 ? f : null;
}

export function filtersFromHash(hash: string): Partial<ListingsFilters> | null {
  const qIndex = hash.indexOf("?");
  if (qIndex === -1) return null;
  const head = hash.replace(/^#\/?/, "").split("/")[0]?.split("?")[0];
  if (head !== "properties") return null;
  return parseFilterParams(new URLSearchParams(hash.slice(qIndex + 1)));
}

/** Parse listing filters from a REAL url query (e.g. /properties?q=…).
 *  The same keys as the hash query — one parser, two URL shapes. */
export function filtersFromSearch(search: string): Partial<ListingsFilters> | null {
  if (!search) return null;
  return parseFilterParams(new URLSearchParams(search));
}

export function viewToHash(v: View, filters?: ListingsFilters): string {
  switch (v.name) {
    case "home":
      return "#/";
    case "property":
      return `#/property/${v.id}`;
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
    case "admin":
      return { name: head } as View;
    case "areas":
      return id ? ({ name: "area", slug: id } as View) : { name: "areas" };
    case "property":
      return id ? { name: "property", id } : null;
    default:
      return null;
  }
}

/* ---------- Real-URL router support (SEO) ----------
 * next.config rewrites serve the SPA at real, crawlable paths:
 *   /property/<id> and /properties. The router prefers the pathname
 * (real URL) and falls back to the hash — old #/ links keep working. */

/** View from a real path (null when the path is not a routed view). */
export function viewFromPathname(): View | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname.replace(/\/+$/, "");
  const m = /^\/property\/([A-Za-z0-9]+)$/.exec(path);
  if (m) return { name: "property", id: m[1] };
  if (path === "/properties") return { name: "properties" };
  return null;
}

/** View from wherever the URL currently encodes it — real path first. */
export function viewFromLocation(): View | null {
  if (typeof window === "undefined") return null;
  return viewFromPathname() ?? hashToView(window.location.hash);
}

/** Real URL path for a view (null → the hash form is the canonical URL). */
export function pathForView(v: View): string | null {
  if (v.name === "property") return `/property/${(v as { id: string }).id}`;
  if (v.name === "properties") return "/properties";
  return null;
}

export function sameView(a: View, b: View): boolean {
  if (a.name !== b.name) return false;
  if (a.name === "property") return a.id === (b as { id: string }).id;
  if (a.name === "area") return a.slug === (b as { slug: string }).slug;
  return true;
}

interface AppState {
  view: View;
  listingsFilters: ListingsFilters;
  favorites: string[];
  recent: string[];
  navigate: (view: View) => void;
  setFilters: (f: Partial<ListingsFilters>) => void;
  resetFilters: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  recordRecent: (id: string) => void;
}

const defaultFilters: ListingsFilters = {
  search: "",
  status: "ALL",
  type: "ALL",
  beds: 0,
  minPrice: null,
  maxPrice: null,
  minArea: null,
  sort: "newest",
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: { name: "home" },
      listingsFilters: defaultFilters,
      favorites: [],
      recent: [],
      navigate: (view) => {
        set({ view });
        if (typeof window !== "undefined") {
          // Real, crawlable URL when the view has one (SEO); hash form for
          // the rest. pushState with a path+hash keeps hashchange/popstate
          // semantics working for back/forward.
          const realPath = pathForView(view);
          let target: string;
          if (realPath) {
            target =
              view.name === "properties"
                ? realPath + filtersToQuery(get().listingsFilters)
                : realPath;
          } else {
            const hash = viewToHash(view);
            // Keep the URL rooted at "/" — a path left over from a real-URL
            // view (e.g. /property/x) must not linger under hash views.
            target = hash === "#/" ? "/" : `/${hash}`;
          }
          if (window.location.pathname + window.location.search + window.location.hash !== target) {
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
      recordRecent: (id) =>
        set((s) => ({
          recent: [id, ...s.recent.filter((r) => r !== id)].slice(0, 8),
        })),
    }),
    {
      name: "city-line-property",
      partialize: (s) => ({
        favorites: s.favorites,
        recent: s.recent,
      }),
    }
  )
);
