"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { CATEGORIES, categoryLabel, type Property } from "@/lib/types";
import { BedDouble, Bath, Ruler, Car, Heart, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { waLink } from "@/lib/business";
import { WhatsAppIcon } from "@/components/site/whatsapp-button";

/** Small tinted chip for the property's category. */
export function CategoryChip({ type, className }: { type: string; className?: string }) {
  const cat = CATEGORIES.find((c) => c.slug === type);
  const label = categoryLabel(type);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        className
      )}
      style={
        cat
          ? { backgroundColor: `${cat.color}14`, color: cat.color }
          : { backgroundColor: "rgba(0,0,0,0.05)", color: "#52525B" }
      }
    >
      {label}
    </span>
  );
}

/** Availability badge — only rendered when the listing is not AVAILABLE. */
function StateBadge({ state }: { state: Property["listingState"] }) {
  if (state === "AVAILABLE") return null;
  const style =
    state === "RESERVED"
      ? "bg-[#F59E0B]/95 text-white"
      : "bg-neutral-800/95 text-white";
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider backdrop-blur", style)}>
      {state === "RENTED" ? "Rented" : state === "SOLD" ? "Sold" : "Reserved"}
    </span>
  );
}

export function PropertyCard({ property, index = 0 }: { property: Property; index?: number }) {
  const { navigate, favorites, toggleFavorite } = useAppStore();
  const isFav = favorites.includes(property.id);
  const isRent = property.status === "RENT";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3), ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-black/[0.07] bg-white transition-shadow duration-300 hover:shadow-[0_20px_48px_-18px_rgba(15,23,42,0.22)]"
      onClick={() => navigate({ name: "property", id: property.id })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") navigate({ name: "property", id: property.id });
      }}
      aria-label={`${property.title} — ${formatPKR(property.price, isRent)}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        <Image
          src={property.images[0]}
          alt={property.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 animate-in fade-in group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {/* Status + availability badges */}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide backdrop-blur",
              isRent
                ? "border border-[#0F766E]/25 bg-white/95 text-[#0B6B5D]"
                : "brand-gradient text-white"
            )}
          >
            {isRent ? "For Rent" : "For Sale"}
          </span>
          <StateBadge state={property.listingState} />
        </div>
        {/* Favorite */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const nowFav = !isFav;
            toggleFavorite(property.id);
            if (nowFav) toast.success("Saved to your shortlist");
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform hover:scale-110 active:scale-95"
          aria-label={isFav ? "Remove from saved" : "Save property"}
        >
          <span key={String(isFav)} className="inline-flex animate-in zoom-in-95 duration-200">
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                isFav ? "fill-rose-500 text-rose-500" : "text-neutral-600"
              )}
            />
          </span>
        </button>
        {/* WhatsApp enquiry — pre-filled with this exact property */}
        <a
          href={waLink(
            `Hi City Line Property! Is "${property.title}" (${property.reference}) still available? Please share details.`
          )}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur transition-transform hover:scale-110 active:scale-95"
          aria-label={`Ask about ${property.title} on WhatsApp`}
        >
          <WhatsAppIcon className="h-4 w-4 text-[#22C55E]" />
        </a>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-semibold tracking-tight tabular-nums text-neutral-900">
            {formatPKR(property.price, isRent)}
          </p>
          <CategoryChip type={property.type} />
        </div>
        <h3 className="mt-1.5 line-clamp-1 text-[15px] font-medium text-neutral-800 transition-colors group-hover:text-[#0B6B5D]">
          {property.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-[13px] text-neutral-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {property.district}, {property.city}
          </span>
        </p>

        <div className="mt-4 flex items-center gap-4 border-t border-neutral-100 pt-3.5 text-[13px] text-neutral-500">
          {property.beds > 0 && (
            <span className="flex items-center gap-1.5" title="Bedrooms">
              <BedDouble className="h-4 w-4 text-neutral-400" />
              {property.beds}
            </span>
          )}
          {property.baths > 0 && (
            <span className="flex items-center gap-1.5" title="Bathrooms">
              <Bath className="h-4 w-4 text-neutral-400" />
              {property.baths}
            </span>
          )}
          <span className="flex items-center gap-1.5" title="Area (sqft)">
            <Ruler className="h-4 w-4 text-neutral-400" />
            {property.area.toLocaleString()} sqft
          </span>
          {property.parking > 0 && (
            <span className="ml-auto hidden items-center gap-1.5 sm:flex" title="Parking">
              <Car className="h-4 w-4 text-neutral-400" />
              {property.parking}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
      <div className="aspect-[4/3] animate-pulse bg-neutral-100" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-1/2 animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
        <div className="h-8 animate-pulse rounded bg-neutral-50" />
      </div>
    </div>
  );
}
