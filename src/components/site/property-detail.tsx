"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCard } from "@/components/site/property-card";
import { useAppStore, viewToHash } from "@/lib/store";
import { formatPKR, monthlyInstallment, formatDate } from "@/lib/format";
import { categoryLabel, type Property } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Bath,
  Ruler,
  Car,
  CalendarDays,
  Eye,
  Heart,
  Share2,
  MapPin,
  Building2,
  Star,
  Phone,
  Mail,
  CheckCircle2,
  Calculator,
  Loader2,
  BadgeCheck,
  ChevronDown,
  GitCompareArrows,
  Check,
  Maximize2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { waLink } from "@/lib/business";
import { Lightbox } from "@/components/site/lightbox";

/** Clipboard write with a legacy fallback; returns false if both fail. */
async function copyLink(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function PropertyDetailView({ id }: { id: string }) {
  const { navigate, favorites, toggleFavorite, compare, toggleCompare, recordRecent } =
    useAppStore();
  const [property, setProperty] = useState<Property | null>(null);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const load = () => {
      setLoading(true);
      setImgIndex(0);
      setNotFound(false);
      fetch(`/api/properties/${id}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
        .then((d) => {
          setProperty(d.property);
          recordRecent(d.property.id);
        })
        .catch(() => setNotFound(true))
        .finally(() => setLoading(false));

      // similar: same type
      fetch(`/api/properties?limit=4&sort=newest`)
        .then((r) => r.json())
        .then((d) => setSimilar((d.properties ?? []).filter((p: Property) => p.id !== id)))
        .catch(() => setSimilar([]));
    };
    load();
  }, [id, recordRecent]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Skeleton className="h-9 w-40 rounded-full" />
        <Skeleton className="mt-6 aspect-[16/9] w-full rounded-3xl" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-28 text-center sm:px-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
          <Building2 className="h-6 w-6 text-neutral-400" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Property not found</h1>
        <p className="mt-2 max-w-sm text-sm text-neutral-500">
          This listing may have been sold, rented out or removed by the owner.
        </p>
        <Button
          onClick={() => navigate({ name: "properties" })}
          className="mt-6 h-11 rounded-full bg-[#C9A227] px-6 text-sm hover:bg-[#A8851D]"
        >
          Browse all properties
        </Button>
      </div>
    );
  }

  const isFav = favorites.includes(property.id);
  const isComparing = compare.includes(property.id);
  const isRent = property.status === "RENT";
  const facts = [
    { icon: BedDouble, label: "Bedrooms", value: property.beds > 0 ? String(property.beds) : "—" },
    { icon: Bath, label: "Bathrooms", value: property.baths > 0 ? String(property.baths) : "—" },
    {
      icon: Ruler,
      label: "Area",
      value: `${property.area.toLocaleString()} sqft`,
    },
    { icon: Car, label: "Parking", value: property.parking > 0 ? `${property.parking} cars` : "—" },
    { icon: Building2, label: "Type", value: categoryLabel(property.type) },
    { icon: CalendarDays, label: "Year built", value: String(property.yearBuilt) },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Back */}
      <button
        onClick={() => navigate({ name: "properties" })}
        className="group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 print:hidden"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        All properties
      </button>

      {/* Gallery */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mt-4"
      >
        <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-neutral-200/70 bg-neutral-100">
          <Image
            key={property.images[imgIndex]}
            src={property.images[imgIndex]}
            alt={`${property.title} — photo ${imgIndex + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="cursor-zoom-in object-cover transition-transform duration-500 hover:scale-[1.02]"
            onClick={() => setLightboxOpen(true)}
          />
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute bottom-4 right-4 flex h-10 items-center gap-1.5 rounded-full bg-white/90 px-3.5 text-[12px] font-semibold text-neutral-700 shadow-sm backdrop-blur transition-all hover:bg-white active:scale-95 print:hidden"
            aria-label="Open full-screen gallery"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            View full screen
          </button>
          <span
            className={cn(
              "absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-white backdrop-blur",
              isRent ? "bg-[#007AFF]/95" : "bg-[#C9A227]/95"
            )}
          >
            {isRent ? "For Rent" : "For Sale"}
          </span>
          <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-medium text-neutral-700 backdrop-blur">
            <Eye className="h-3.5 w-3.5" />
            {property.views.toLocaleString()} views
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3 print:hidden">
          {property.images.map((img, i) => (
            <button
              key={img + i}
              onClick={() => {
                setImgIndex(i);
                setLightboxOpen(true);
              }}
              className={cn(
                "relative aspect-[16/10] overflow-hidden rounded-xl border-2 bg-neutral-100 transition-all",
                imgIndex === i
                  ? "border-neutral-900"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
              aria-label={`View photo ${i + 1}`}
            >
              <Image src={img} alt="" fill sizes="25vw" className="object-cover" />
            </button>
          ))}
        </div>
        <Lightbox
          images={property.images}
          index={imgIndex}
          alt={property.title}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setImgIndex}
        />
      </motion.div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.65fr_1fr]">
        {/* LEFT */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F7EFD4] px-2.5 py-1 text-[12px] font-semibold text-[#8C6D1F]">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified listing
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] font-medium text-neutral-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {property.rating.toFixed(1)}
                  </span>
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                  {property.title}
                </h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
                  <MapPin className="h-4 w-4" />
                  {property.address}, {property.district}, {property.city}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const ok = toggleCompare(property.id);
                    if (ok) toast.success("Added to compare");
                    else if (!isComparing) toast.info("You can compare up to 4 properties");
                  }}
                  className={cn(
                    "flex h-11 items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition-all",
                    isComparing
                      ? "border-[#C9A227] bg-[#C9A227] text-white"
                      : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                  )}
                  aria-label={isComparing ? "Remove from compare" : "Add to compare"}
                  aria-pressed={isComparing}
                >
                  {isComparing ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}
                  {isComparing ? "Comparing" : "Compare"}
                </button>
                <button
                  onClick={() => {
                    const nowFav = !isFav;
                    toggleFavorite(property.id);
                    if (nowFav) toast.success("Saved to your shortlist");
                    else toast("Removed from your shortlist");
                  }}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border transition-all",
                    isFav
                      ? "border-rose-200 bg-rose-50"
                      : "border-neutral-200 bg-white hover:bg-neutral-50"
                  )}
                  aria-label={isFav ? "Remove from saved" : "Save property"}
                >
                  <span
                    key={String(isFav)}
                    className="inline-flex animate-in zoom-in-95 duration-200"
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        isFav ? "fill-rose-500 text-rose-500" : "text-neutral-500"
                      )}
                    />
                  </span>
                </button>
                <button
                  onClick={async () => {
                    const url = `${window.location.origin}${window.location.pathname}${viewToHash({ name: "property", id: property.id })}`;
                    try {
                      if (navigator.share) {
                        await navigator.share({ title: property.title, url });
                        return;
                      }
                    } catch {
                      return; /* user cancelled native share */
                    }
                    if (await copyLink(url)) {
                      toast.success("Link copied to clipboard");
                    } else {
                      toast("Copy property link", {
                        description: url,
                        duration: 10000,
                      });
                    }
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition-all hover:bg-neutral-50 hover:text-neutral-900"
                  aria-label="Share property"
                >
                  <Share2 className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition-all hover:bg-neutral-50 hover:text-neutral-900"
                  aria-label="Print property flyer"
                  title="Print flyer"
                >
                  <Printer className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums text-neutral-900">
              {formatPKR(property.price, isRent)}
              {isRent && (
                <span className="ml-1 text-sm font-normal text-neutral-400">
                  monthly
                </span>
              )}
            </p>

            {/* Facts */}
            <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-200/60 sm:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label} className="bg-white px-5 py-4">
                  <fact.icon className="h-4.5 w-4.5 text-neutral-400" />
                  <p className="mt-2 text-[15px] font-semibold text-neutral-900">{fact.value}</p>
                  <p className="text-[12px] text-neutral-400">{fact.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Description */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-10"
          >
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
              About this property
            </h2>
            <p className="mt-3 text-[15px] leading-[1.8] text-neutral-600">
              {property.description}
            </p>
            <p className="mt-4 text-[13px] text-neutral-400">
              Listed {formatDate(property.createdAt)} · Reference #{property.slug}
            </p>
          </motion.section>

          {/* Amenities */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10"
          >
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
              Amenities & features
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {property.amenities.map((a) => (
                <div
                  key={a}
                  className="flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3 text-[14px] text-neutral-700"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#A8851D]" />
                  {a}
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* RIGHT — sticky sidebar */}
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start print:hidden"
        >
          <AgentCardWithForm property={property} />
          <MortgageCalculator price={property.price} isRent={isRent} />
        </motion.aside>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-16 print:hidden">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
            You may also like
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.slice(0, 3).map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------------- Agent card + inquiry form ---------------- */

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function AgentCardWithForm({ property }: { property: Property }) {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(
    `Hi, I'd like to arrange a viewing for "${property.title}".`
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          kind: "VIEWING",
          propertyId: property.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setSent(true);
      toast.success("Request sent!", {
        description: `${property.agent.name} will reach out within a few hours.`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
      {/* Agent */}
      <button
        onClick={() => navigate({ name: "agent", id: property.agent.id })}
        className="group flex w-full items-center gap-4 border-b border-neutral-100 bg-neutral-50/50 p-5 text-left transition-colors hover:bg-neutral-100/70"
        aria-label={`View ${property.agent.name}'s profile`}
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white transition-transform group-hover:scale-105"
          style={{ backgroundColor: property.agent.accent }}
        >
          {property.agent.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-neutral-900 group-hover:text-[#8C6D1F]">
            {property.agent.name}
          </p>
          <p className="truncate text-[13px] text-neutral-500">{property.agent.title}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-500 transition-colors group-hover:border-[#C9A227]/40 group-hover:text-[#8C6D1F]">
          View profile
          <ArrowRight className="h-3 w-3" />
        </span>
      </button>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-2">
          <a
            href={`tel:${property.agent.phone.replace(/\s/g, "")}`}
            className="flex h-10 items-center justify-center gap-2 rounded-full border border-neutral-200 text-[13.5px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <Phone className="h-3.5 w-3.5" />
            {property.agent.phone}
          </a>
          <a
            href={`mailto:${property.agent.email}`}
            className="flex h-10 items-center justify-center gap-2 rounded-full border border-neutral-200 text-[13.5px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <Mail className="h-3.5 w-3.5" />
            {property.agent.email}
          </a>
          <a
            href={waLink(
              `Hi City Line Property! I'm interested in "${property.title}" (${property.reference}, ${formatPKR(property.price)}). Please share details.`,
              "923094499940"
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] text-[13.5px] font-semibold text-white shadow-[0_6px_18px_-6px_rgba(37,211,102,0.6)] transition-all hover:bg-[#1FB855]"
            aria-label="Enquire about this property on WhatsApp"
          >
            <WhatsAppGlyph className="h-4 w-4" />
            Enquire on WhatsApp
          </a>
        </div>

        <Separator className="my-5" />

        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between text-[15px] font-semibold text-neutral-900"
        >
          Request a viewing
          <ChevronDown
            className={cn("h-4 w-4 text-neutral-400 transition-transform", open && "rotate-180")}
          />
        </button>

        {open && (
          sent ? (
            <div className="mt-4 rounded-xl border border-[#C9A227]/40 bg-[#F7EFD4]/60 p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[#A8851D]" />
              <p className="mt-2 text-sm font-semibold text-[#8C6D1F]">Viewing requested</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#8C6D1F]">
                We&rsquo;ve sent your details to {property.agent.name}. Expect a reply
                within a few working hours.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="inq-name" className="text-[13px] text-neutral-600">
                  Full name
                </Label>
                <Input
                  id="inq-name"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ali Hassan"
                  className="h-10 rounded-xl border-neutral-200 bg-neutral-50 text-sm focus-visible:ring-neutral-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inq-email" className="text-[13px] text-neutral-600">
                    Email
                  </Label>
                  <Input
                    id="inq-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-10 rounded-xl border-neutral-200 bg-neutral-50 text-sm focus-visible:ring-neutral-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inq-phone" className="text-[13px] text-neutral-600">
                    Phone
                  </Label>
                  <Input
                    id="inq-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 3xx …"
                    className="h-10 rounded-xl border-neutral-200 bg-neutral-50 text-sm focus-visible:ring-neutral-300"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inq-msg" className="text-[13px] text-neutral-600">
                  Message
                </Label>
                <Textarea
                  id="inq-msg"
                  required
                  minLength={5}
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="resize-none rounded-xl border-neutral-200 bg-neutral-50 text-sm focus-visible:ring-neutral-300"
                />
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="h-11 w-full rounded-full bg-[#C9A227] text-sm font-medium hover:bg-[#A8851D]"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send request"
                )}
              </Button>
              <p className="text-center text-[11.5px] text-neutral-400">
                No spam. Your details are only shared with this agent.
              </p>
            </form>
          )
        )}
      </div>
    </div>
  );
}

/* ---------------- Mortgage calculator ---------------- */
function MortgageCalculator({ price, isRent }: { price: number; isRent: boolean }) {
  const [downPct, setDownPct] = useState(30);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(18);

  if (isRent) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E9CE7A] to-[#A8851D] text-white">
            <Calculator className="h-4 w-4" />
          </span>
          <h3 className="text-[15px] font-semibold text-neutral-900">Annual rent outlook</h3>
        </div>
        <div className="mt-5 space-y-2.5 text-sm">
          <div className="flex justify-between text-neutral-500">
            <span>Monthly rent</span>
            <span className="font-semibold text-neutral-900">{formatPKR(price, true)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Per year (×12)</span>
            <span className="font-semibold text-neutral-900">{formatPKR(price * 12)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-100 pt-2.5 text-neutral-500">
            <span>Typical advance (3 mo)</span>
            <span className="font-semibold text-neutral-900">{formatPKR(price * 3)}</span>
          </div>
        </div>
      </div>
    );
  }

  const monthly = monthlyInstallment(price, downPct, years, rate);

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E9CE7A] to-[#A8851D] text-white">
          <Calculator className="h-4 w-4" />
        </span>
        <h3 className="text-[15px] font-semibold text-neutral-900">Instalment estimator</h3>
      </div>
      <div className="mt-5 space-y-5">
        <div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-neutral-600">Down payment</span>
            <span className="font-semibold text-neutral-900">
              {downPct}% · {formatPKR((price * downPct) / 100)}
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={90}
            step={5}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="mt-2 w-full accent-[#A8851D]"
            aria-label="Down payment percentage"
          />
        </div>
        <div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-neutral-600">Loan term</span>
            <span className="font-semibold text-neutral-900">{years} years</span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="mt-2 w-full accent-[#A8851D]"
            aria-label="Loan term in years"
          />
        </div>
        <div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-neutral-600">Interest rate</span>
            <span className="font-semibold text-neutral-900">{rate}% / year</span>
          </div>
          <input
            type="range"
            min={8}
            max={24}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-2 w-full accent-[#A8851D]"
            aria-label="Annual interest rate"
          />
        </div>
        <div className="rounded-xl bg-gradient-to-br from-[#8C6D1F] to-[#6B5310] p-4 text-white">
          <p className="text-[12px] text-neutral-400">Estimated monthly instalment</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">
            {formatPKR(monthly, true)}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
            Indicative only — actual bank terms vary.
          </p>
        </div>
      </div>
    </div>
  );
}
