"use client";

/**
 * Categories tab — manage listing categories (name, lucide icon, color,
 * description, sort order). Deletion is blocked by the API (409) while
 * listings still use the category; the error is surfaced as a toast.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BedDouble,
  Briefcase,
  Building,
  Building2,
  Car,
  Droplets,
  Dumbbell,
  Factory,
  Hammer,
  Home,
  Hotel,
  KeyRound,
  LandPlot,
  Layers,
  Palette,
  Pencil,
  Plus,
  ShieldCheck,
  Sofa,
  Sparkles,
  Store,
  Sun,
  Trash2,
  Trees,
  Warehouse,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  AdminApi,
  AdminCard,
  GOLD_BTN,
  errorMessage,
  fadeUp,
  isAuthLoss,
} from "./admin-shared";

interface AdminCat {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  sortOrder: number;
  inUse: number;
}

/** Curated lucide icon set that categories can reference by name. */
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LandPlot, Store, Home, Building2, Warehouse, BedDouble, KeyRound,
  Building, Hotel, Factory, Briefcase, Car, Sofa, Trees, Hammer,
  Layers, Palette, ShieldCheck, Sparkles, Droplets, Sun, Wifi, Dumbbell,
};

function IconByName({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Building2;
  return <Icon className={className} />;
}

interface CatForm {
  name: string;
  icon: string;
  color: string;
  description: string;
  sortOrder: string;
}

const EMPTY_FORM: CatForm = { name: "", icon: "Building2", color: "#C9A227", description: "", sortOrder: "99" };

export function AdminCategories({ api }: { api: AdminApi }) {
  const [state, setState] = useState<{ key: string; cats: AdminCat[] } | null>(null);
  const [reload, setReload] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCat | null>(null);
  const [form, setForm] = useState<CatForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCat | null>(null);
  const [deleting, setDeleting] = useState(false);

  const key = `cats-${reload}`;

  useEffect(() => {
    let alive = true;
    api<{ categories: AdminCat[] }>("/api/admin/categories")
      .then((d) => {
        if (alive) setState({ key, cats: d.categories });
      })
      .catch((err) => {
        if (!alive || isAuthLoss(err)) return;
        setLoadError(errorMessage(err));
        setState({ key, cats: [] });
      });
    return () => {
      alive = false;
    };
  }, [key, api]);

  const loading = !state || state.key !== key;
  const cats = useMemo(
    () => (state?.key === key ? [...state.cats].sort((a, b) => a.sortOrder - b.sortOrder) : []),
    [state, key]
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sortOrder: String((state?.cats.length ?? 0) + 1) });
    setDialogOpen(true);
  };

  const openEdit = (c: AdminCat) => {
    setEditing(c);
    setForm({
      name: c.name,
      icon: c.icon,
      color: c.color,
      description: c.description,
      sortOrder: String(c.sortOrder),
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    const body = {
      name: form.name.trim(),
      icon: form.icon.trim() || "Building2",
      color: form.color,
      description: form.description.trim(),
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (editing) {
        await api(`/api/admin/categories/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
        toast.success(`Category "${body.name}" updated`);
      } else {
        await api("/api/admin/categories", { method: "POST", body: JSON.stringify(body) });
        toast.success(`Category "${body.name}" created`);
      }
      setDialogOpen(false);
      setReload((r) => r + 1);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    const c = deleteTarget;
    if (!c) return;
    setDeleting(true);
    try {
      await api(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      toast.success(`Category "${c.name}" deleted`);
      setReload((r) => r + 1);
    } catch (err) {
      if (!isAuthLoss(err)) {
        // API returns 409 while listings still use this category.
        toast.error(errorMessage(err));
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.02 }}>
        <AdminCard className="p-4 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-semibold text-neutral-900">Listing categories</h3>
              <p className="mt-0.5 text-[12px] text-neutral-400">
                Categories power the homepage tiles and inventory filters. Deleting is blocked while
                listings still use a category.
              </p>
            </div>
            <Button
              onClick={openAdd}
              className={`h-10 rounded-xl px-4 text-[13px] font-semibold ${GOLD_BTN}`}
            >
              <Plus className="h-4 w-4" /> Add category
            </Button>
          </div>
        </AdminCard>
      </motion.div>

      {loadError && (
        <p className="rounded-2xl border border-[#FF3B30]/25 bg-[#FF3B30]/[0.06] px-4 py-3 text-[13px] text-[#C0392B]">
          {loadError}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-3xl" />)
        ) : (
          cats.map((c, i) => {
            return (
              <motion.div
                key={c.id}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: Math.min(i * 0.03, 0.12) }}
              >
                <AdminCard className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${c.color}1A`, color: c.color }}
                        aria-hidden
                      >
                        <IconByName name={c.icon} className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-[14px] font-semibold text-neutral-900">{c.name}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-neutral-400">
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-black/10"
                            style={{ backgroundColor: c.color }}
                            aria-hidden
                          />
                          <code className="rounded bg-black/[0.04] px-1.5 py-px text-[10.5px]">{c.slug}</code>
                          <span>· #{c.sortOrder}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(c)}
                        aria-label={`Edit ${c.name}`}
                        className="h-8 w-8 rounded-lg text-neutral-400 hover:bg-black/[0.05] hover:text-neutral-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteTarget(c)}
                        aria-label={`Delete ${c.name}`}
                        className="h-8 w-8 rounded-lg text-neutral-300 hover:bg-[#FF3B30]/10 hover:text-[#FF3B30]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {c.description && (
                    <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-neutral-500">
                      {c.description}
                    </p>
                  )}
                  <div className="mt-auto pt-3">
                    {c.inUse > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-semibold text-neutral-500">
                        Used by {c.inUse} listing{c.inUse === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#34C759]/10 px-2.5 py-1 text-[11px] font-semibold text-[#1E8E3E]">
                        Unused — safe to delete
                      </span>
                    )}
                  </div>
                </AdminCard>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-black/[0.06] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold tracking-tight text-neutral-900">
              {editing ? `Edit "${editing.name}"` : "New category"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-neutral-400">
              {editing
                ? "Rename or recolor — listings keep their slug link automatically."
                : "The slug is generated from the name. Pick any lucide icon name."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name" className="text-[12px] text-neutral-500">
                Name *
              </Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Farm Houses"
                className="h-10 rounded-xl border-black/[0.09] text-[13.5px] focus-visible:ring-[#C9A227]/35"
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cat-icon" className="text-[12px] text-neutral-500">
                  Icon (lucide name)
                </Label>
                <Input
                  id="cat-icon"
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="Building2"
                  className="h-10 rounded-xl border-black/[0.09] font-mono text-[12.5px] focus-visible:ring-[#C9A227]/35"
                />
                <p className="text-[10.5px] leading-tight text-neutral-400">
                  Try: LandPlot, Store, Home, Building2, Warehouse, BedDouble, KeyRound, Hotel, Trees…
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-color" className="text-[12px] text-neutral-500">
                  Color
                </Label>
                <div className="flex h-10 items-center gap-2">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.08]"
                    style={{ backgroundColor: `${form.color}1A`, color: form.color }}
                    aria-hidden
                  >
                    <IconByName name={form.icon} className="h-5 w-5" />
                  </span>
                  <input
                    id="cat-color"
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="h-10 w-12 cursor-pointer rounded-xl border border-black/[0.08] bg-white p-1"
                    aria-label="Category color"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc" className="text-[12px] text-neutral-500">
                Description
              </Label>
              <Textarea
                id="cat-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short blurb shown on the homepage tile"
                className="resize-none rounded-xl border-black/[0.09] text-[13px] focus-visible:ring-[#C9A227]/35"
              />
            </div>
            <div className="w-32 space-y-1.5">
              <Label htmlFor="cat-order" className="text-[12px] text-neutral-500">
                Sort order
              </Label>
              <Input
                id="cat-order"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                className="h-10 rounded-xl border-black/[0.09] text-[13.5px] tabular-nums focus-visible:ring-[#C9A227]/35"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              className="rounded-xl border-black/[0.09]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => void save()}
              disabled={saving || form.name.trim().length < 3}
              className={`rounded-xl px-5 text-[13px] font-semibold ${GOLD_BTN}`}
            >
              {editing ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl border-black/[0.06]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-900">
              Delete category &ldquo;{deleteTarget?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13.5px] text-neutral-500">
              {deleteTarget && deleteTarget.inUse > 0
                ? `${deleteTarget.inUse} listing(s) still use this category — the server will refuse until they are moved.`
                : "This category is unused and will be removed immediately."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-black/[0.09]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void doDelete()}
              disabled={deleting}
              className="rounded-xl bg-[#FF3B30] text-white hover:bg-[#FF3B30]/90"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
