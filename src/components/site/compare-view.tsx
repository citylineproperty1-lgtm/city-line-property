"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { categoryLabel, type Property } from "@/lib/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  X,
  BedDouble,
  Bath,
  Ruler,
  Car,
  CalendarDays,
  Star,
  MapPin,
  Building2,
  GitCompareArrows,
  CheckCircle2,
  BadgeDollarSign,
  Trophy,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function CompareView() {
  const { compare, toggleCompare, clearCompare, navigate } = useAppStore();
  const compareKey = compare.join(",");
  const [loaded, setLoaded] = useState<{ key: string; items: Property[] }>({
    key: "",
    items: [],
  });
  const loading = compareKey !== "" && loaded.key !== compareKey;

  useEffect(() => {
    if (compareKey === "") return;
    let alive = true;
    fetch(`/api/properties?ids=${compareKey}&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setLoaded({ key: compareKey, items: d.properties ?? [] });
      })
      .catch(() => {
        if (alive) setLoaded({ key: compareKey, items: [] });
      });
    return () => {
      alive = false;
    };
  }, [compareKey]);

  const shown = compareKey === "" ? [] : loaded.key === compareKey ? loaded.items : [];
  const items = shown;

  const best = useMemo(() => {
    if (shown.length < 2) return null;
    return {
      cheapest: shown.reduce((a, b) => (a.price <= b.price ? a : b)),
      biggest: shown.reduce((a, b) => (a.area >= b.area ? a : b)),
      mostBeds: shown.reduce((a, b) => (a.beds >= b.beds ? a : b)),
    };
  }, [shown]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Skeleton className="h-9 w-48 rounded-full" />
        <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (compare.length === 0 || shown.length === 0) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-28 text-center sm:px-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
          <GitCompareArrows className="h-6 w-6 text-neutral-400" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Nothing to compare yet</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
          Tap the{" "}
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[12px] font-medium">
            <GitCompareArrows className="h-3 w-3" /> Compare
          </span>{" "}
          button on any property card to add it here — pick up to 4 listings and see them
          side by side.
        </p>
        <Button
          onClick={() => navigate({ name: "properties" })}
          className="mt-6 h-11 rounded-full gold-gradient px-6 text-sm text-white shadow-[0_6px_16px_-6px_rgba(154,123,26,0.7)] hover:opacity-95"
        >
          Browse properties
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate({ name: "properties" })}
          className="group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          All properties
        </button>
        <button
          onClick={() => {
            clearCompare();
            toast.success("Compare list cleared");
          }}
          className="rounded-full border border-neutral-200 px-4 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          Clear all
        </button>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <span className="gold-gradient flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-[0_6px_16px_-6px_rgba(154,123,26,0.7)]">
          <GitCompareArrows className="h-4.5 w-4.5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Compare properties
          </h1>
          <p className="text-sm text-neutral-500">
            {items.length} listing{items.length > 1 ? "s" : ""} side by side · up to 4
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 [scrollbar-width:thin]">
        <div className="min-w-[560px]">
      {/* Card headers */}
      <div
        className="mt-8 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white"
          >
            <button
              onClick={() => toggleCompare(p.id)}
              className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow-sm backdrop-blur transition-all hover:bg-[#C9A227] hover:text-white"
              aria-label={`Remove ${p.title} from comparison`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="relative aspect-[4/3] bg-neutral-100">
              <Image
                src={p.images[0]}
                alt={p.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {best?.cheapest.id === p.id && items.length > 1 && (
                <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[#A8851D] px-2.5 py-1 text-[10.5px] font-semibold text-white shadow-sm">
                  <BadgeDollarSign className="h-3 w-3" /> Best price
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="text-lg font-semibold tracking-tight tabular-nums text-neutral-900">
                {formatPKR(p.price, p.status === "RENT")}
              </p>
              <h3 className="mt-1 line-clamp-2 text-[13.5px] font-medium leading-snug text-neutral-700">
                {p.title}
              </h3>
              <button
                onClick={() => navigate({ name: "property", id: p.id })}
                className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-neutral-200 text-[12.5px] font-medium text-neutral-700 transition-colors hover:bg-[#C9A227] hover:text-white"
              >
                <Eye className="h-3.5 w-3.5" /> View details
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Spec table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200/80">
        <Row count={items.length} label="Status">
          {items.map((p) => (
            <Cell key={p.id}>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
                  p.status === "RENT"
                    ? "bg-[#F7EFD4] text-[#8C6D1F]"
                    : "bg-neutral-100 text-neutral-700"
                )}
              >
                {p.status === "RENT" ? "For Rent" : "For Sale"}
              </span>
            </Cell>
          ))}
        </Row>
        <Row count={items.length} label="Type" striped>
          {items.map((p) => (
            <Cell key={p.id}>{categoryLabel(p.type)}</Cell>
          ))}
        </Row>
        <Row count={items.length} label="Location">
          {items.map((p) => (
            <Cell key={p.id}>
              <span className="flex items-center gap-1 text-[13px]">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                {p.district}
              </span>
            </Cell>
          ))}
        </Row>
        <Row count={items.length} label="Bedrooms" striped>
          {items.map((p) => (
            <Cell key={p.id} highlight={best?.mostBeds.id === p.id && items.length > 1}>
              <span className="flex items-center gap-1.5">
                <BedDouble className="h-4 w-4 text-neutral-400" />
                {p.beds > 0 ? p.beds : "—"}
                {best?.mostBeds.id === p.id && items.length > 1 && p.beds > 0 && (
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                )}
              </span>
            </Cell>
          ))}
        </Row>
        <Row count={items.length} label="Bathrooms">
          {items.map((p) => (
            <Cell key={p.id}>
              <span className="flex items-center gap-1.5">
                <Bath className="h-4 w-4 text-neutral-400" />
                {p.baths > 0 ? p.baths : "—"}
              </span>
            </Cell>
          ))}
        </Row>
        <Row count={items.length} label="Area" striped>
          {items.map((p) => (
            <Cell key={p.id} highlight={best?.biggest.id === p.id && items.length > 1}>
              <span className="flex items-center gap-1.5">
                <Ruler className="h-4 w-4 text-neutral-400" />
                {p.area.toLocaleString()} sqft
              </span>
            </Cell>
          ))}
        </Row>
        <Row count={items.length} label="Parking">
          {items.map((p) => (
            <Cell key={p.id}>
              <span className="flex items-center gap-1.5">
                <Car className="h-4 w-4 text-neutral-400" />
                {p.parking > 0 ? `${p.parking} cars` : "—"}
              </span>
            </Cell>
          ))}
        </Row>
        <Row count={items.length} label="Year built" striped>
          {items.map((p) => (
            <Cell key={p.id}>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-neutral-400" />
                {p.yearBuilt}
              </span>
            </Cell>
          ))}
        </Row>
        <Row count={items.length} label="Rating">
          {items.map((p) => (
            <Cell key={p.id}>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {p.rating.toFixed(1)}
              </span>
            </Cell>
          ))}
        </Row>
        <Row count={items.length} label="Amenities" striped>
          {items.map((p) => (
            <Cell key={p.id}>
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                {p.amenities.map((a) => (
                  <span
                    key={a}
                    className="flex items-start gap-1.5 text-left text-[12px] leading-snug text-neutral-600"
                  >
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#A8851D]" />
                    {a}
                  </span>
                ))}
              </div>
            </Cell>
          ))}
        </Row>
      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-neutral-400">
        <Trophy className="h-3.5 w-3.5 text-amber-500" />
        Trophies mark the best value in each category across your selection.
      </p>
      </div>
      </div>
    </div>
  );
}

function Row({
  label,
  striped,
  count,
  children,
}: {
  label: string;
  striped?: boolean;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid divide-neutral-100",
        striped ? "bg-neutral-50/60" : "bg-white"
      )}
      style={{ gridTemplateColumns: `minmax(110px, 0.55fr) repeat(${count}, minmax(0, 1fr))` }}
    >
      <div className="flex items-center px-4 py-3.5 text-[12px] font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </div>
      {children}
    </div>
  );
}

function Cell({
  children,
  highlight,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center border-l border-neutral-100 px-4 py-3.5 text-[13.5px] font-medium text-neutral-800",
        highlight && "bg-amber-50/50"
      )}
    >
      {children}
    </div>
  );
}
