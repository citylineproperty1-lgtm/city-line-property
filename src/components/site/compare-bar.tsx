"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { X, GitCompareArrows, Loader2 } from "lucide-react";

interface ListItem {
  id: string;
  title: string;
  images: string[];
}

export function CompareBar({ items }: { items: ListItem[] }) {
  const { compare, toggleCompare, clearCompare, navigate } = useAppStore();

  const selected = compare
    .map((id) => items.find((p) => p.id === id))
    .filter(Boolean) as ListItem[];

  return (
    <AnimatePresence>
      {compare.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-x-3 bottom-4 z-40 sm:inset-x-auto sm:left-1/2 sm:w-auto sm:-translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white/95 p-2.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            {/* thumbnails */}
            <div className="flex items-center gap-2 pl-1">
              {selected.map((p) => (
                <div key={p.id} className="group relative">
                  <div className="relative h-11 w-14 overflow-hidden rounded-lg border border-neutral-200">
                    <Image
                      src={p.images[0]}
                      alt={p.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <button
                    onClick={() => toggleCompare(p.id)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Remove ${p.title} from compare`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {selected.length < compare.length && (
                <div className="flex h-11 w-14 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-300" />
                </div>
              )}
              {compare.length < 4 &&
                Array.from({ length: Math.min(3, 4 - compare.length) }).map((_, i) => (
                  <div
                    key={i}
                    className="hidden h-11 w-14 items-center justify-center rounded-lg border border-dashed border-neutral-300 text-[10px] font-medium text-neutral-300 sm:flex"
                  >
                    Add
                  </div>
                ))}
            </div>

            <div className="hidden h-9 w-px bg-neutral-200 sm:block" />

            <button
              onClick={clearCompare}
              className="rounded-full px-3 py-2 text-[12.5px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              Clear
            </button>

            <button
              onClick={() => navigate({ name: "compare" })}
              disabled={compare.length < 2}
              className="flex h-10 items-center gap-2 rounded-full bg-neutral-900 px-4 text-[13px] font-semibold text-white transition-all hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <GitCompareArrows className="h-4 w-4" />
              Compare{compare.length > 1 ? ` (${compare.length})` : ""}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CompareBarLoader() {
  const { compare, view } = useAppStore();
  const [items, setItems] = useState<ListItem[]>([]);

  useEffect(() => {
    if (compare.length === 0) return;
    let alive = true;
    const ids = compare.join(",");
    fetch(`/api/properties?ids=${ids}&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setItems(d.properties ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [compare]);

  if (view.name === "compare") return null;

  return <CompareBar items={items} />;
}
