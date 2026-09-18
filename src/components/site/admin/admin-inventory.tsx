"use client";

/**
 * Inventory tab — the core listing manager.
 * Search + state/category filters, desktop table / mobile cards, inline
 * price popover, inline listing-state, published switch, featured star,
 * delete with confirm, and the full add/edit drawer.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import {
  Crown,
  Home,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPKR } from "@/lib/format";
import { LISTING_STATES, type Property } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AdminApi,
  AdminCard,
  GOLD_BTN,
  LISTING_STATE_META,
  SCROLLBAR_CLS,
  Segmented,
  errorMessage,
  fadeUp,
  isAuthLoss,
  useDebounced,
} from "./admin-shared";
import { AdminListingDrawer, type AdminCategory } from "./admin-listing-drawer";

const STATE_FILTERS = [
  { value: "ALL", label: "All states" },
  { value: "AVAILABLE", label: "Available" },
  { value: "RESERVED", label: "Reserved" },
  { value: "SOLD", label: "Sold" },
  { value: "RENTED", label: "Rented" },
] as const;

export function AdminInventory({ api }: { api: AdminApi }) {
  const [qInput, setQInput] = useState("");
  const q = useDebounced(qInput, 250);
  const [state, setState] = useState("ALL");
  const [category, setCategory] = useState("ALL");

  const [cats, setCats] = useState<{ key: string; cats: AdminCategory[] } | null>(null);
  const [list, setList] = useState<{ key: string; items: Property[] } | null>(null);
  const [reload, setReload] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Drawer state: which listing is open + a sequence so remounting resets the form.
  const [editing, setEditing] = useState<Property | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSeq, setDrawerSeq] = useState(0);

  const [priceEditId, setPriceEditId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  // Mount only ONE representation so controlled Radix popovers never fight.
  const isMobile = useIsMobile();

  const listKey = `inv-${q}|${state}|${category}|${reload}`;

  // Categories load once per session.
  useEffect(() => {
    let alive = true;
    api<{ categories: AdminCategory[] }>("/api/admin/categories")
      .then((d) => {
        if (alive) setCats({ key: "cats", cats: d.categories });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [api]);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (state !== "ALL") params.set("state", state);
    if (category !== "ALL") params.set("category", category);
    api<{ properties: Property[] }>(`/api/admin/properties?${params.toString()}`)
      .then((d) => {
        if (alive) setList({ key: listKey, items: d.properties });
      })
      .catch((err) => {
        if (!alive || isAuthLoss(err)) return;
        setLoadError(errorMessage(err));
        setList({ key: listKey, items: [] });
      });
    return () => {
      alive = false;
    };
  }, [listKey, api, q, state, category]);

  const loading = !list || list.key !== listKey;
  const items = list?.key === listKey ? list.items : [];
  const categories = cats?.cats ?? [];

  const openDrawer = (p: Property | null) => {
    setEditing(p);
    setDrawerSeq((s) => s + 1);
    setDrawerOpen(true);
  };

  const patchRow = async (p: Property, body: Record<string, unknown>, okMsg: string) => {
    setBusyId(p.id);
    try {
      const d = await api<{ property: Property }>(`/api/admin/properties/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setList((prev) =>
        prev && prev.key === listKey
          ? { ...prev, items: prev.items.map((it) => (it.id === p.id ? d.property : it)) }
          : prev
      );
      toast.success(okMsg);
      return d.property;
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const savePrice = async (p: Property) => {
    const price = Number(priceDraft);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a valid price in PKR.");
      return;
    }
    setPriceEditId(null);
    await patchRow(p, { price }, `${p.reference} price updated`);
  };

  const doDelete = async () => {
    const p = deleteTarget;
    if (!p) return;
    setBusyId(p.id);
    try {
      await api(`/api/admin/properties/${p.id}`, { method: "DELETE" });
      setList((prev) =>
        prev && prev.key === listKey
          ? { ...prev, items: prev.items.filter((it) => it.id !== p.id) }
          : prev
      );
      toast.success(`${p.reference} deleted`);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  };

  const onSavedDrawer = (p: Property) => {
    setDrawerOpen(false);
    toast.success(editing ? `${p.reference} updated` : `${p.reference} created`);
    if (!editing) {
      setReload((r) => r + 1); // include the new listing in the (possibly filtered) list
    } else {
      setList((prev) =>
        prev && prev.key === listKey
          ? { ...prev, items: prev.items.map((it) => (it.id === p.id ? p : it)) }
          : prev
      );
    }
    setEditing(null);
  };

  const totalShown = items.length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.02 }}>
        <AdminCard className="p-4 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Search reference, title or area…"
                aria-label="Search inventory"
                className="h-10 rounded-xl border-black/[0.09] pl-9 text-[13.5px] focus-visible:ring-[#C9A227]/35"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="h-10 w-[136px] rounded-xl border-black/[0.09] text-[13px] focus-visible:ring-[#C9A227]/35">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATE_FILTERS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10 w-[158px] rounded-xl border-black/[0.09] text-[13px] focus-visible:ring-[#C9A227]/35">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All categories</SelectItem>
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
              <Button
                onClick={() => openDrawer(null)}
                className={`h-10 rounded-xl px-4 text-[13px] font-semibold ${GOLD_BTN}`}
              >
                <Plus className="h-4 w-4" /> Add listing
              </Button>
            </div>
          </div>
          <p className="mt-2.5 text-[11.5px] text-neutral-400">
            {loading ? "Loading inventory…" : `${totalShown} listing${totalShown === 1 ? "" : "s"} shown`}
          </p>
        </AdminCard>
      </motion.div>

      {loadError && (
        <p className="rounded-2xl border border-[#FF3B30]/25 bg-[#FF3B30]/[0.06] px-4 py-3 text-[13px] text-[#C0392B]">
          {loadError}
        </p>
      )}

      {/* Desktop table */}
      <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }} className={isMobile ? "hidden" : undefined}>
        {!isMobile && (
          <AdminCard className="p-2 sm:p-3">
            {loading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <InventoryEmpty />
            ) : (
            <div className={`max-h-[70vh] overflow-y-auto ${SCROLLBAR_CLS}`}>
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                  <TableRow className="border-black/[0.05] hover:bg-transparent">
                    <TableHead className="min-w-[260px] text-[11px] uppercase tracking-wider text-neutral-400">
                      Listing
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider text-neutral-400">Category</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider text-neutral-400">Price</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider text-neutral-400">State</TableHead>
                    <TableHead className="text-center text-[11px] uppercase tracking-wider text-neutral-400">Live</TableHead>
                    <TableHead className="text-center text-[11px] uppercase tracking-wider text-neutral-400">Featured</TableHead>
                    <TableHead className="text-right text-[11px] uppercase tracking-wider text-neutral-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((p) => (
                    <TableRow
                      key={p.id}
                      onClick={() => openDrawer(p)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") openDrawer(p);
                      }}
                      tabIndex={0}
                      aria-label={`Edit ${p.title}`}
                      className="cursor-pointer border-black/[0.05] hover:bg-[#C9A227]/[0.04]"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Thumb images={p.images} title={p.title} />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-neutral-900">{p.title}</p>
                            <p className="mt-0.5 text-[11.5px] text-neutral-400">
                              <span className="font-semibold text-[#8A7119]">{p.reference}</span> · {p.district}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <CategoryChip slug={p.type} categories={categories} />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <PriceEditor
                          open={priceEditId === p.id}
                          onOpenChange={(o) => {
                            setPriceEditId(o ? p.id : null);
                            if (o) setPriceDraft(String(p.price));
                          }}
                          price={p.price}
                          onSave={() => void savePrice(p)}
                          draft={priceDraft}
                          setDraft={setPriceDraft}
                          busy={busyId === p.id}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <StateSelect p={p} onPatch={(body, msg) => void patchRow(p, body, msg)} busy={busyId === p.id} />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                        <Switch
                          checked={p.published}
                          disabled={busyId === p.id}
                          onCheckedChange={(v) =>
                            void patchRow(p, { published: v }, v ? `${p.reference} is live` : `${p.reference} hidden`)
                          }
                          aria-label={`Toggle published for ${p.title}`}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                        <button
                          onClick={() => void patchRow(p, { featured: !p.featured }, p.featured ? "Removed from featured" : "Added to featured")}
                          disabled={busyId === p.id}
                          aria-label={p.featured ? `Unfeature ${p.title}` : `Feature ${p.title}`}
                          aria-pressed={p.featured}
                          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#C9A227]/10"
                        >
                          <Star
                            className={`h-4 w-4 ${p.featured ? "fill-[#C9A227] text-[#C9A227]" : "text-neutral-300 hover:text-[#C9A227]/60"}`}
                          />
                        </button>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openDrawer(p)}
                            aria-label={`Edit ${p.title}`}
                            className="h-8 w-8 rounded-lg text-neutral-500 hover:bg-black/[0.05] hover:text-neutral-900"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteTarget(p)}
                            aria-label={`Delete ${p.title}`}
                            className="h-8 w-8 rounded-lg text-neutral-400 hover:bg-[#FF3B30]/10 hover:text-[#FF3B30]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </AdminCard>
        )}
      </motion.section>

      {/* Mobile cards */}
      {isMobile && (
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)
        ) : items.length === 0 ? (
          <AdminCard>
            <InventoryEmpty />
          </AdminCard>
        ) : (
          items.map((p) => (
            <motion.div key={p.id} {...fadeUp}>
              <AdminCard
                className="cursor-pointer p-4 active:scale-[0.995]"
                // tap opens the drawer; inner controls stop propagation
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openDrawer(p)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openDrawer(p);
                  }}
                  aria-label={`Edit ${p.title}`}
                >
                  <div className="flex gap-3">
                    <Thumb images={p.images} title={p.title} className="h-20 w-24" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-neutral-900">
                          {p.title}
                        </p>
                        <Star
                          className={`mt-0.5 h-4 w-4 shrink-0 ${p.featured ? "fill-[#C9A227] text-[#C9A227]" : "text-neutral-300"}`}
                        />
                      </div>
                      <p className="mt-1 text-[11.5px] text-neutral-400">
                        <span className="font-semibold text-[#8A7119]">{p.reference}</span> · {p.district}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <CategoryChip slug={p.type} categories={categories} />
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${
                            LISTING_STATE_META[p.listingState]?.chip ?? ""
                          }`}
                        >
                          {LISTING_STATE_META[p.listingState]?.label ?? p.listingState}
                        </span>
                        {!p.published && (
                          <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10.5px] font-semibold text-neutral-500">
                            Draft
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-3 flex items-center justify-between gap-2 border-t border-black/[0.05] pt-3"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <PriceEditor
                      open={priceEditId === p.id}
                      onOpenChange={(o) => {
                        setPriceEditId(o ? p.id : null);
                        if (o) setPriceDraft(String(p.price));
                      }}
                      price={p.price}
                      onSave={() => void savePrice(p)}
                      draft={priceDraft}
                      setDraft={setPriceDraft}
                      busy={busyId === p.id}
                    />
                    <div className="flex items-center gap-2.5">
                      <StateSelect p={p} onPatch={(body, msg) => void patchRow(p, body, msg)} busy={busyId === p.id} />
                      <Switch
                        checked={p.published}
                        disabled={busyId === p.id}
                        onCheckedChange={(v) =>
                          void patchRow(p, { published: v }, v ? `${p.reference} is live` : `${p.reference} hidden`)
                        }
                        aria-label={`Toggle published for ${p.title}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteTarget(p)}
                        aria-label={`Delete ${p.title}`}
                        className="h-8 w-8 rounded-lg text-neutral-400 hover:bg-[#FF3B30]/10 hover:text-[#FF3B30]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </AdminCard>
            </motion.div>
          ))
        )}
      </div>
      )}

      {/* Add / edit drawer — key remount resets form state per open */}
      <AdminListingDrawer
        key={`${editing?.id ?? "new"}-${drawerSeq}`}
        api={api}
        listing={editing}
        categories={categories}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSaved={onSavedDrawer}
      />

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl border-black/[0.06]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-900">
              Delete {deleteTarget?.reference}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13.5px] text-neutral-500">
              &ldquo;{deleteTarget?.title}&rdquo; will be permanently removed from the inventory,
              together with its views and lead history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-black/[0.09]">
              Keep listing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void doDelete()}
              disabled={busyId === deleteTarget?.id}
              className="rounded-xl bg-[#FF3B30] text-white hover:bg-[#FF3B30]/90"
            >
              <Trash2 className="h-4 w-4" /> Delete listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------ Subcomponents ------------------------------ */

function Thumb({ images, title, className = "h-11 w-14" }: { images: string[]; title: string; className?: string }) {
  const src = images[0];
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-xl border border-black/[0.07] bg-neutral-100 ${className}`}>
      {src ? (
        <Image src={src} alt="" fill sizes="96px" className="object-cover" unoptimized />
      ) : (
        <span className="flex h-full items-center justify-center text-neutral-300">
          <Home className="h-4 w-4" />
        </span>
      )}
      <span className="sr-only">{title}</span>
    </div>
  );
}

function CategoryChip({ slug, categories }: { slug: string; categories: AdminCategory[] }) {
  const cat = categories.find((c) => c.slug === slug);
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/[0.07] bg-black/[0.025] px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600"
      title={cat?.name ?? slug}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: cat?.color ?? "#C9A227" }}
        aria-hidden
      />
      <span className="max-w-28 truncate">{cat?.name ?? slug}</span>
    </span>
  );
}

function PriceEditor({
  open,
  onOpenChange,
  price,
  draft,
  setDraft,
  onSave,
  busy,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  price: number;
  draft: string;
  setDraft: (v: string) => void;
  onSave: () => void;
  busy: boolean;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="group inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[13px] font-semibold tabular-nums text-neutral-900 transition-colors hover:bg-[#C9A227]/10"
          aria-label={`Edit price, currently ${formatPKR(price)}`}
        >
          {formatPKR(price)}
          <Pencil className="h-3 w-3 text-neutral-300 transition-colors group-hover:text-[#C9A227]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-60 rounded-2xl border-black/[0.08] p-3.5"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Update price (PKR)
        </p>
        <Input
          type="number"
          min={1}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
          }}
          className="mt-2 h-9 rounded-xl border-black/[0.09] text-[13px] tabular-nums focus-visible:ring-[#C9A227]/35"
        />
        <Button
          size="sm"
          onClick={onSave}
          disabled={busy}
          className={`mt-2.5 h-9 w-full rounded-xl text-[12.5px] font-semibold ${GOLD_BTN}`}
        >
          Save price
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function StateSelect({
  p,
  onPatch,
  busy,
}: {
  p: Property;
  onPatch: (body: Record<string, unknown>, msg: string) => void;
  busy: boolean;
}) {
  return (
    <Select
      value={p.listingState}
      onValueChange={(v) => {
        if (v !== p.listingState) onPatch({ listingState: v }, `${p.reference} → ${LISTING_STATE_META[v]?.label ?? v}`);
      }}
      disabled={busy}
    >
      <SelectTrigger
        aria-label={`Listing state for ${p.title}`}
        className={`h-7 w-[112px] rounded-full border px-2.5 text-[11px] font-semibold ${LISTING_STATE_META[p.listingState]?.chip ?? ""}`}
      >
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
  );
}

function InventoryEmpty() {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04]">
        <Home className="h-5 w-5 text-neutral-300" />
      </span>
      <p className="mt-3 text-[14px] font-semibold text-neutral-700">No listings match</p>
      <p className="mt-1 max-w-xs text-[12.5px] text-neutral-400">
        Try a different search or filter — or add a new listing with the gold button.
      </p>
    </div>
  );
}
