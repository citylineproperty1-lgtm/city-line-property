"use client";

/**
 * Add / edit listing drawer (Sheet, right side).
 * Full inventory form: fields, amenities tag input, images manager with
 * upload + URL add + cover ordering. Save → POST/PATCH /api/admin/properties.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crown,
  ImagePlus,
  Link2,
  Loader2,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPKR, pkrInWords } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AREAS } from "@/lib/business";
import { LISTING_STATES, type Property } from "@/lib/types";
import {
  AdminApi,
  BRAND_BTN,
  BRAND_TEXT,
  LISTING_STATE_META,
  Segmented,
  errorMessage,
  isAuthLoss,
} from "./admin-shared";

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface ListingForm {
  title: string;
  description: string;
  price: string;
  status: "SALE" | "RENT";
  type: string;
  beds: string;
  baths: string;
  parking: string;
  yearBuilt: string;
  area: string;
  address: string;
  district: string;
  listingState: string;
  published: boolean;
  featured: boolean;
  amenities: string[];
  images: string[];
}

/**
 * One-tap common amenities (Zameen-style) — tapping a chip adds it to the
 * listing automatically; tapping again removes it. Custom amenities can
 * still be typed in the input below.
 */
const AMENITY_PRESETS = [
  "Solar System",
  "Electricity Backup",
  "Servant Quarter",
  "Security Staff",
  "Maintenance Staff",
  "Furnished",
  "Elevator",
  "Gas",
  "Water Supply",
  "Waste Disposal",
  "CCTV Cameras",
  "Boundary Wall",
  "Park Facing",
  "Mosque Nearby",
  "Market Nearby",
  "Facilities for Disabled",
];

function formFrom(p: Property | null): ListingForm {
  return {
    title: p?.title ?? "",
    description: p?.description ?? "",
    price: p ? String(p.price) : "",
    status: p?.status ?? "SALE",
    type: p?.type ?? "",
    beds: p ? String(p.beds) : "0",
    baths: p ? String(p.baths) : "0",
    parking: p?.parking ?? "",
    yearBuilt: p ? String(p.yearBuilt) : String(new Date().getFullYear()),
    area: p ? String(p.area) : "",
    address: p?.address ?? "",
    district: p?.district ?? AREAS[0],
    listingState: p?.listingState ?? "AVAILABLE",
    published: p?.published ?? true,
    featured: p?.featured ?? false,
    amenities: p?.amenities ?? [],
    images: p?.images ?? [],
  };
}

export function AdminListingDrawer({
  api,
  listing,
  categories,
  open,
  onClose,
  onSaved,
}: {
  api: AdminApi;
  listing: Property | null;
  categories: AdminCategory[];
  open: boolean;
  onClose: () => void;
  onSaved: (property: Property) => void;
}) {
  const [form, setForm] = useState<ListingForm>(() => formFrom(listing));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amenityDraft, setAmenityDraft] = useState("");
  const [urlDraft, setUrlDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addAmenity = () => {
    const name = amenityDraft.trim();
    if (!name) return;
    if (form.amenities.some((a) => a.toLowerCase() === name.toLowerCase())) {
      setAmenityDraft("");
      return;
    }
    set("amenities", [...form.amenities, name]);
    setAmenityDraft("");
  };

  /** Quick-pick toggle: tap to add to the listing, tap again to remove. */
  const toggleAmenity = (name: string) => {
    const exists = form.amenities.some((a) => a.toLowerCase() === name.toLowerCase());
    set(
      "amenities",
      exists
        ? form.amenities.filter((a) => a.toLowerCase() !== name.toLowerCase())
        : [...form.amenities, name]
    );
  };

  const addImageUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    set("images", [...form.images, url]);
    setUrlDraft("");
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const d = await api<{ path: string }>("/api/admin/upload", { method: "POST", body: fd });
      set("images", [...form.images, d.path]);
    } catch (err) {
      if (!isAuthLoss(err)) setError(errorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (idx: number) =>
    set(
      "images",
      form.images.filter((_, i) => i !== idx)
    );

  const setCover = (idx: number) => {
    if (idx === 0) return;
    const next = [...form.images];
    const [picked] = next.splice(idx, 1);
    set("images", [picked, ...next]);
  };

  /* Drag-to-reorder (plus arrow buttons for keyboard / touch precision). */
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const reorderImage = (from: number, to: number) => {
    if (from === to || to < 0 || to >= form.images.length) return;
    const next = [...form.images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    set("images", next);
  };

  const save = async () => {
    if (saving) return;
    setError(null);
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      status: form.status,
      type: form.type,
      beds: Number(form.beds) || 0,
      baths: Number(form.baths) || 0,
      parking: form.parking.trim(),
      yearBuilt: Number(form.yearBuilt) || new Date().getFullYear(),
      area: Number(form.area) || 0,
      address: form.address.trim(),
      district: form.district,
      city: "Lahore",
      listingState: form.listingState,
      published: form.published,
      featured: form.featured,
      amenities: form.amenities,
      images: form.images,
    };
    try {
      const d = listing
        ? await api<{ property: Property }>(`/api/admin/properties/${listing.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await api<{ property: Property }>("/api/admin/properties", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      onSaved(d.property);
    } catch (err) {
      if (!isAuthLoss(err)) setError(errorMessage(err));
      setSaving(false);
    }
  };

  const numInput = (k: keyof ListingForm, props: {
    id: string;
    label: string;
    min?: number;
    placeholder?: string;
    step?: string;
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={props.id} className="text-[12px] text-neutral-500">
        {props.label}
      </Label>
      <Input
        id={props.id}
        type="number"
        inputMode="numeric"
        min={props.min ?? 0}
        step={props.step}
        placeholder={props.placeholder}
        value={form[k] as string}
        onChange={(e) => set(k, e.target.value as ListingForm[typeof k])}
        className="h-10 rounded-xl border-black/[0.09] text-[13.5px] focus-visible:ring-[#0F766E]/35"
      />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl lg:max-w-2xl"
      >
        <SheetHeader className="gap-1 border-b border-black/[0.06] bg-white px-5 py-4 sm:px-6">
          <SheetTitle className="text-[16px] font-semibold tracking-tight text-neutral-900">
            {listing ? (
              <>
                Edit listing{" "}
                <span className={`text-[12.5px] font-semibold ${BRAND_TEXT}`}>{listing.reference}</span>
              </>
            ) : (
              "Add new listing"
            )}
          </SheetTitle>
          <SheetDescription className="text-[12.5px] text-neutral-400">
            {listing
              ? "Changes go live the moment the listing is published."
              : "Reference (CLP-1xx) and web address are assigned automatically."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-5 py-5 sm:px-6">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="rounded-xl bg-[#E5484D]/[0.08] px-3.5 py-2.5 text-[12.5px] font-medium text-[#D5303B]"
            >
              {error}
            </motion.p>
          )}

          {/* Core */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="f-title" className="text-[12px] text-neutral-500">
                Title *
              </Label>
              <Input
                id="f-title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="5 Marla house — Royal Enclave"
                className="h-10 rounded-xl border-black/[0.09] text-[13.5px] focus-visible:ring-[#0F766E]/35"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-desc" className="text-[12px] text-neutral-500">
                Description
              </Label>
              <Textarea
                id="f-desc"
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Highlight the block, plot number, facing, possession status…"
                className="resize-none rounded-xl border-black/[0.09] text-[13.5px] focus-visible:ring-[#0F766E]/35"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="f-price" className="text-[12px] text-neutral-500">
                  Price (PKR) * {form.status === "RENT" && "· per month"}
                </Label>
                <Input
                  id="f-price"
                  type="number"
                  min={1}
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="12500000"
                  className="h-10 rounded-xl border-black/[0.09] text-[13.5px] tabular-nums focus-visible:ring-[#0F766E]/35"
                />
                {(() => {
                  const n = Number(form.price);
                  if (!form.price || !Number.isFinite(n) || n <= 0) {
                    return (
                      <p className="text-[11px] text-neutral-400">
                        Type the price — we show it in words so you can double-check.
                      </p>
                    );
                  }
                  return (
                    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11.5px] leading-snug">
                      <span className="font-semibold tabular-nums text-neutral-700">
                        = {formatPKR(n)}
                      </span>
                      <span className="rounded-full bg-[#E7F4F0] px-2 py-0.5 font-semibold text-[#0B6B5D]">
                        {pkrInWords(n)}
                      </span>
                      {form.status === "RENT" && (
                        <span className="text-neutral-400">per month</span>
                      )}
                    </p>
                  );
                })()}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-neutral-500">Deal type *</Label>
                <Segmented
                  layoutId="drawer-deal"
                  options={[
                    { value: "SALE", label: "For Sale" },
                    { value: "RENT", label: "For Rent" },
                  ]}
                  value={form.status}
                  onChange={(v) => set("status", v)}
                  className="w-fit"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[12px] text-neutral-500">Category *</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger className="h-10 w-full rounded-xl border-black/[0.09] text-[13.5px] focus-visible:ring-[#0F766E]/35">
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-neutral-500">Area *</Label>
                <Select value={form.district} onValueChange={(v) => set("district", v)}>
                  <SelectTrigger className="h-10 w-full rounded-xl border-black/[0.09] text-[13.5px] focus-visible:ring-[#0F766E]/35">
                    <SelectValue placeholder="Choose area" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-address" className="text-[12px] text-neutral-500">
                Address / block detail
              </Label>
              <Input
                id="f-address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Block C, 150 ft boulevard"
                className="h-10 rounded-xl border-black/[0.09] text-[13.5px] focus-visible:ring-[#0F766E]/35"
              />
            </div>
          </div>

          {/* Specs */}
          <fieldset className="rounded-2xl border border-black/[0.06] p-4">
            <legend className="px-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Specifications
            </legend>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {numInput("beds", { id: "f-beds", label: "Bedrooms" })}
              {numInput("baths", { id: "f-baths", label: "Bathrooms" })}
              <div className="space-y-1.5">
                <Label htmlFor="f-parking" className="text-[12px] text-neutral-500">
                  Parking
                </Label>
                <Input
                  id="f-parking"
                  value={form.parking}
                  onChange={(e) => set("parking", e.target.value)}
                  placeholder="e.g. Available"
                  className="h-10 rounded-xl border-black/[0.09] text-[13.5px] focus-visible:ring-[#0F766E]/35"
                />
                <p className="text-[11px] text-neutral-400">
                  Just write “Available” — no numbers needed.
                </p>
              </div>
              {numInput("yearBuilt", { id: "f-year", label: "Year built", min: 1950 })}
              {numInput("area", { id: "f-area", label: "Area (sqft)" })}
            </div>
          </fieldset>

          {/* Status + flags */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-neutral-500">Listing state</Label>
              <Select value={form.listingState} onValueChange={(v) => set("listingState", v)}>
                <SelectTrigger className="h-10 w-full rounded-xl border-black/[0.09] text-[13.5px] focus-visible:ring-[#0F766E]/35">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LISTING_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {LISTING_STATE_META[s]?.label ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center justify-between rounded-2xl border border-black/[0.06] px-4 py-3">
              <span className="flex items-center gap-2 text-[13px] font-medium text-neutral-700">
                <Star className="h-4 w-4 text-[#0F766E]" /> Published
              </span>
              <Switch
                checked={form.published}
                onCheckedChange={(v) => set("published", v)}
                aria-label="Published on public site"
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-black/[0.06] px-4 py-3">
              <span className="flex items-center gap-2 text-[13px] font-medium text-neutral-700">
                <Crown className="h-4 w-4 text-[#0F766E]" /> Featured
              </span>
              <Switch
                checked={form.featured}
                onCheckedChange={(v) => set("featured", v)}
                aria-label="Featured on homepage"
              />
            </label>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <Label className="text-[12px] text-neutral-500">Amenities</Label>
              <span className="text-[11px] text-neutral-400">
                Tap a common one — it&apos;s added to the post automatically
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                value={amenityDraft}
                onChange={(e) => setAmenityDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAmenity();
                  }
                }}
                placeholder="e.g. Solar system, Servant quarter…"
                className="h-10 flex-1 rounded-xl border-black/[0.09] text-[13.5px] focus-visible:ring-[#0F766E]/35"
              />
              <Button
                type="button"
                onClick={addAmenity}
                variant="outline"
                className="h-10 rounded-xl border-black/[0.09] px-3.5"
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            {/* Quick picks — selected chips mirror the tags below */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {AMENITY_PRESETS.map((preset) => {
                const active = form.amenities.some(
                  (a) => a.toLowerCase() === preset.toLowerCase()
                );
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleAmenity(preset)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                      active
                        ? "border-[#0F766E] bg-[#0F766E] text-white shadow-[0_4px_10px_-4px_rgba(15,118,110,0.55)]"
                        : "border-black/[0.08] bg-white text-neutral-600 hover:border-[#0F766E]/40 hover:bg-[#F7FBFA] hover:text-[#0B6B5D]"
                    )}
                  >
                    {active && <Check className="h-3 w-3" />}
                    {preset}
                  </button>
                );
              })}
            </div>
            {form.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.amenities.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 rounded-full border border-[#0F766E]/30 bg-[#E7F4F0] py-1 pl-2.5 pr-1.5 text-[12px] font-medium text-[#0B6B5D]"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => set("amenities", form.amenities.filter((x) => x !== a))}
                      aria-label={`Remove amenity ${a}`}
                      className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-[#0F766E]/15"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Images manager */}
          <div className="space-y-2.5">
            <Label className="text-[12px] text-neutral-500">
              Photos{" "}
              <span className="text-neutral-400">
                · drag to reorder — first image is the cover
              </span>
            </Label>
            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {form.images.map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    draggable
                    onDragStart={(e) => {
                      setDragIdx(i);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={() => {
                      if (dragIdx === null || dragIdx === i) return;
                      reorderImage(dragIdx, i);
                      setDragIdx(i);
                    }}
                    onDrop={(e) => e.preventDefault()}
                    onDragEnd={() => setDragIdx(null)}
                    className={cn(
                      "group relative aspect-[4/3] overflow-hidden rounded-xl border border-black/[0.08] cursor-grab active:cursor-grabbing",
                      dragIdx === i && "opacity-40 ring-2 ring-[#0F766E]"
                    )}
                  >
                    <Image
                      src={src}
                      alt={`Photo ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 30vw, 160px"
                      className="object-cover"
                      unoptimized
                    />
                    {i === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-[#0F766E] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label={`Remove photo ${i + 1}`}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-[#FF3B30]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute inset-x-1.5 bottom-1.5 flex items-center gap-1">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => reorderImage(i, i - 1)}
                        aria-label={`Move photo ${i + 1} earlier`}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75 disabled:opacity-30"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      {i !== 0 ? (
                        <button
                          type="button"
                          onClick={() => setCover(i)}
                          className="min-w-0 flex-1 truncate rounded-lg bg-black/55 py-1 text-[10px] font-semibold text-white backdrop-blur transition-colors hover:bg-black/75"
                        >
                          Set as cover
                        </button>
                      ) : (
                        <span className="min-w-0 flex-1 truncate rounded-lg bg-black/35 py-1 text-center text-[10px] font-semibold text-white/90 backdrop-blur">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={i === form.images.length - 1}
                        onClick={() => reorderImage(i, i + 1)}
                        aria-label={`Move photo ${i + 1} later`}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75 disabled:opacity-30"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                  <Input
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addImageUrl();
                      }
                    }}
                    placeholder="Paste image URL…"
                    className="h-10 rounded-xl border-black/[0.09] pl-9 text-[13px] focus-visible:ring-[#0F766E]/35"
                  />
                </div>
                <Button
                  type="button"
                  onClick={addImageUrl}
                  variant="outline"
                  className="h-10 rounded-xl border-black/[0.09] px-3.5"
                >
                  <ImagePlus className="h-4 w-4" /> Attach
                </Button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadFile(f);
                }}
              />
              <Button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                variant="outline"
                className="h-10 rounded-xl border-black/[0.09] px-3.5"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Upload file
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-neutral-400">
              JPG · PNG · WebP · AVIF, up to 5 MB. Uploaded files are stored in /uploads.
            </p>
          </div>
        </div>

        <SheetFooter className="sticky bottom-0 flex-row items-center gap-2 border-t border-black/[0.06] bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <p className="mr-auto hidden text-[11px] text-neutral-400 sm:block">
            {listing ? `Editing ${listing.reference}` : "New listings appear in Inventory instantly"}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="h-10 rounded-xl border-black/[0.09]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className={`h-10 rounded-xl px-5 text-[13.5px] font-semibold ${BRAND_BTN}`}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : listing ? (
              "Save changes"
            ) : (
              <>
                <Plus className="h-4 w-4" /> Create listing
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Re-export for sibling modules (inventory passes categories of this shape).
export type { AdminCategory };
