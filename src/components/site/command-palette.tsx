"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Building2,
  CornerDownLeft,
  GitCompareArrows,
  Heart,
  Home,
  LineChart,
  Loader2,
  Mail,
  MapPin,
  Newspaper,
  Search,
  Users,
  X,
} from "lucide-react";
import { useAppStore, type View } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Property } from "@/lib/types";

interface PaletteItem {
  key: string;
  label: string;
  sub?: string;
  right?: string;
  image?: string;
  icon?: React.ReactNode;
  run: () => void;
}

const KBD =
  "inline-flex h-5 min-w-5 items-center justify-center rounded border border-neutral-200 bg-neutral-50 px-1 text-[10px] font-medium text-neutral-500";

function iconBox(node: React.ReactNode) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
      {node}
    </span>
  );
}

export function CommandPalette() {
  const { paletteOpen, setPalette, navigate, setFilters, favorites, compare, clearCompare } =
    useAppStore();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; items: Property[] }>({
    key: "",
    items: [],
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();
  const searching = trimmed !== "";
  const resultsReady = loaded.key === trimmed;
  const loading = searching && !resultsReady;

  /* global ⌘K / Ctrl+K */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(!useAppStore.getState().paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPalette]);

  /* scroll lock while open */
  useEffect(() => {
    if (!paletteOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [paletteOpen]);

  const close = () => setPalette(false);
  const go = (v: View) => {
    close();
    navigate(v);
  };

  const handleQuery = (v: string) => {
    setQuery(v);
    setActive(0);
    const q = v.trim();
    if (timer.current) clearTimeout(timer.current);
    if (q === "") {
      seq.current += 1;
      setLoaded({ key: "", items: [] });
      return;
    }
    timer.current = setTimeout(() => {
      const mine = ++seq.current;
      fetch(`/api/properties?search=${encodeURIComponent(q)}&limit=6`)
        .then((r) => r.json())
        .then((d) => {
          if (seq.current === mine) setLoaded({ key: q, items: d.properties ?? [] });
        })
        .catch(() => {
          if (seq.current === mine) setLoaded({ key: q, items: [] });
        });
    }, 220);
  };

  const goGroup: PaletteItem[] = [
    { key: "home", label: "Home", icon: iconBox(<Home className="h-4 w-4" />), run: () => go({ name: "home" }) },
    {
      key: "properties",
      label: "Browse properties",
      icon: iconBox(<Building2 className="h-4 w-4" />),
      run: () => go({ name: "properties" }),
    },
    {
      key: "insights",
      label: "Market insights",
      icon: iconBox(<LineChart className="h-4 w-4" />),
      run: () => go({ name: "insights" }),
    },
    {
      key: "digest",
      label: "Property digest",
      sub: "Market notes & guides",
      icon: iconBox(<Newspaper className="h-4 w-4" />),
      run: () => go({ name: "digest" }),
    },
    {
      key: "areas",
      label: "Area guides",
      sub: "The five areas we cover",
      icon: iconBox(<MapPin className="h-4 w-4" />),
      run: () => go({ name: "areas" }),
    },
    { key: "about", label: "About us", icon: iconBox(<Users className="h-4 w-4" />), run: () => go({ name: "about" }) },
    { key: "contact", label: "Contact", icon: iconBox(<Mail className="h-4 w-4" />), run: () => go({ name: "contact" }) },
  ];

  const shortcutGroup: PaletteItem[] = [];
  shortcutGroup.push({
    key: "saved",
    label: "Saved homes",
    sub: `${favorites.length} ${favorites.length === 1 ? "home" : "homes"} shortlisted`,
    icon: iconBox(<Heart className="h-4 w-4" />),
    run: () => go({ name: "saved" }),
  });
  if (compare.length >= 2) {
    shortcutGroup.push({
      key: "compare",
      label: "Compare properties",
      sub: `${compare.length} selected`,
      icon: iconBox(<GitCompareArrows className="h-4 w-4" />),
      run: () => go({ name: "compare" }),
    });
  }
  if (compare.length > 0) {
    shortcutGroup.push({
      key: "clear-compare",
      label: "Clear comparison",
      icon: iconBox(<X className="h-4 w-4" />),
      run: () => {
        clearCompare();
        toast.success("Comparison cleared");
        close();
      },
    });
  }

  const propertyItems: PaletteItem[] =
    searching && resultsReady
      ? loaded.items.map((p) => ({
          key: p.id,
          label: p.title,
          sub: `${p.district}, ${p.city}`,
          right: formatPKR(p.price, p.status === "RENT"),
          image: p.images[0],
          run: () => go({ name: "property", id: p.id }),
        }))
      : [];

  const seeAllItem: PaletteItem | null =
    searching && resultsReady
      ? {
          key: "see-all",
          label: `See all results for “${trimmed}”`,
          icon: iconBox(<Search className="h-4 w-4" />),
          run: () => {
            close();
            setFilters({ search: trimmed });
            navigate({ name: "properties" });
          },
        }
      : null;

  const flat: PaletteItem[] = !searching
    ? [...goGroup, ...shortcutGroup]
    : [...propertyItems, ...(seeAllItem ? [seeAllItem] : [])];

  const safeActive = Math.min(active, Math.max(flat.length - 1, 0));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (flat.length === 0 ? 0 : (i + 1) % flat.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (flat.length === 0 ? 0 : (i - 1 + flat.length) % flat.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flat[safeActive]?.run();
    }
  };

  const row = (item: PaletteItem, i: number, groupLabel?: string) => (
    <div key={item.key}>
      {groupLabel && i === 0 && (
        <p className="px-3 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          {groupLabel}
        </p>
      )}
      <button
        onClick={item.run}
        onMouseEnter={() => setActive(i)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
          safeActive === i ? "bg-neutral-100" : "bg-transparent"
        )}
        role="option"
        aria-selected={safeActive === i}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 rounded-xl object-cover"
          />
        ) : (
          item.icon
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium text-neutral-800">
            {item.label}
          </span>
          {item.sub && (
            <span className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-neutral-400">
              {item.image && <MapPin className="h-3 w-3 shrink-0" />}
              {item.sub}
            </span>
          )}
        </span>
        {item.right && (
          <span className="shrink-0 text-[13px] font-semibold tabular-nums text-neutral-900">
            {item.right}
          </span>
        )}
        {safeActive === i && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-neutral-400" />}
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {paletteOpen && (
        <div
          className="fixed inset-0 z-[80] print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Quick find"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-neutral-950/25 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
            className="absolute inset-x-4 top-[9vh] mx-auto max-w-[560px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_24px_80px_-16px_rgba(0,0,0,0.35)] sm:inset-x-0"
          >
            {/* input */}
            <div className="flex items-center gap-3 border-b border-neutral-100 px-4">
              <Search className="h-[18px] w-[18px] shrink-0 text-neutral-400" />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => handleQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search homes, areas or jump to a page…"
                aria-label="Search"
                className="h-14 flex-1 bg-transparent text-[16px] text-neutral-900 outline-none placeholder:text-neutral-400"
              />
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-neutral-300" />
              ) : (
                <button onClick={close} className={KBD} aria-label="Close quick find">
                  esc
                </button>
              )}
            </div>

            {/* results */}
            <div className="max-h-[52vh] overflow-y-auto p-2" role="listbox" aria-label="Results">
              {!searching && (
                <>
                  {goGroup.map((it, i) => row(it, i, "Go to"))}
                  {shortcutGroup.map((it, i) =>
                    row(it, goGroup.length + i, i === 0 ? "Shortcuts" : undefined)
                  )}
                </>
              )}

              {searching && loading && (
                <div className="space-y-1 p-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="h-9 w-9 animate-pulse rounded-xl bg-neutral-100" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-2/3 animate-pulse rounded bg-neutral-100" />
                        <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-50" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searching && !loading && flat.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium text-neutral-700">
                    No homes match “{trimmed}”
                  </p>
                  <p className="mt-1 text-[13px] text-neutral-400">
                    Try an area like Etihad Town Phase 1 or Royal Enclave.
                  </p>
                </div>
              )}

              {searching && !loading && flat.length > 0 && (
                <>
                  {propertyItems.map((it, i) => row(it, i, "Properties"))}
                  {seeAllItem && row(seeAllItem, propertyItems.length)}
                </>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center gap-4 border-t border-neutral-100 bg-neutral-50/60 px-4 py-2.5">
              <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                <kbd className={KBD}>↑</kbd>
                <kbd className={KBD}>↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                <kbd className={KBD}>↵</kbd>
                Open
              </span>
              <span className="ml-auto hidden text-[11px] text-neutral-300 sm:block">
                Quick find
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
