"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PropertyCard, PropertyCardSkeleton } from "@/components/site/property-card";
import { useAppStore } from "@/lib/store";
import type { Property } from "@/lib/types";
import { Heart, GitCompareArrows } from "lucide-react";
import { toast } from "sonner";

export function SavedView() {
  const { favorites, navigate, startCompare, compare } = useAppStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      if (favorites.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      fetch(`/api/properties?ids=${favorites.join(",")}`)
        .then((r) => r.json())
        .then((d) => setProperties(d.properties ?? []))
        .catch(() => setProperties([]))
        .finally(() => setLoading(false));
    };
    load();
  }, [favorites]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50">
          <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Saved properties
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {loading
              ? "Loading your shortlist…"
              : `${properties.length} ${properties.length === 1 ? "home" : "homes"} in your shortlist`}
          </p>
        </div>
      </div>

      {/* Compare shortcut */}
      {!loading && properties.length >= 2 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/60 px-5 py-4">
          <p className="text-[13.5px] text-neutral-600">
            Shortlisted {properties.length} homes? See them side by side — specs,
            prices and amenities in one table.
          </p>
          <button
            onClick={() => {
              const fresh = properties.filter((p) => !compare.includes(p.id)).map((p) => p.id);
              startCompare([...compare, ...fresh]);
              toast.success("Shortlist ready to compare");
              navigate({ name: "compare" });
            }}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-neutral-900 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-neutral-700"
          >
            <GitCompareArrows className="h-4 w-4" />
            Compare saved
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/60 py-20 text-center"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
            <Heart className="h-6 w-6 text-neutral-300" />
          </span>
          <h3 className="mt-5 text-lg font-semibold tracking-tight text-neutral-900">
            Nothing saved yet
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
            Tap the heart on any property to keep it here — your shortlist stays on
            this device even after you close the browser.
          </p>
          <Button
            onClick={() => navigate({ name: "properties" })}
            className="mt-6 h-11 rounded-full bg-neutral-900 px-6 text-sm font-medium hover:bg-neutral-700"
          >
            Explore properties
          </Button>
        </motion.div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
