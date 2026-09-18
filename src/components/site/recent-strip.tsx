"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { type Property } from "@/lib/types";
import { History, MapPin, X } from "lucide-react";

export function RecentStrip() {
  const { recent, navigate } = useAppStore();
  const [items, setItems] = useState<Property[]>([]);
  const recentKey = recent.join(",");

  useEffect(() => {
    if (recent.length === 0) return;
    let alive = true;
    fetch(`/api/properties?ids=${recent.join(",")}&limit=8`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const props: Property[] = d.properties ?? [];
        // preserve recency order
        const order = new Map(recent.map((id, i) => [id, i]));
        props.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
        setItems(props);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [recentKey]);

  if (recent.length === 0 || items.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-4 pt-20 sm:px-6" aria-label="Recently viewed properties">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider text-emerald-600">
            <History className="h-3.5 w-3.5" />
            Pick up where you left off
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
            Recently viewed
          </h2>
        </div>
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
        {items.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            onClick={() => navigate({ name: "property", id: p.id })}
            className="group w-64 shrink-0 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white text-left transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-[16/10] bg-neutral-100">
              <Image
                src={p.images[0]}
                alt={p.title}
                fill
                sizes="256px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </div>
            <div className="p-4">
              <p className="text-[15px] font-semibold tracking-tight text-neutral-900">
                {formatPKR(p.price, p.status === "RENT")}
              </p>
              <h3 className="mt-0.5 line-clamp-1 text-[13px] font-medium text-neutral-600">
                {p.title}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-[12px] text-neutral-400">
                <MapPin className="h-3 w-3" />
                {p.district}, {p.city}
              </p>
            </div>
          </motion.button>
        ))}

        {/* Clear history card */}
        <button
          onClick={() => useAppStore.setState({ recent: [] })}
          className="flex w-24 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-600"
          aria-label="Clear recently viewed"
        >
          <X className="h-4 w-4" />
          <span className="text-[11px] font-medium">Clear</span>
        </button>
      </div>
    </section>
  );
}
