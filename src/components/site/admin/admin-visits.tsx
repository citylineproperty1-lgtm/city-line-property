"use client";

/**
 * Visits tab — CRM site-visit scheduler. Book property viewings, track them
 * through PLANNED → DONE / NO_SHOW / CANCELLED, reschedule, and call or
 * WhatsApp the customer straight from the card.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  CalendarClock,
  CalendarPlus,
  Check,
  CircleSlash,
  Clock,
  MapPin,
  Phone,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { AREAS } from "@/lib/business";
import type { SiteVisit } from "@/lib/types";
import {
  AdminApi,
  AdminCard,
  BRAND_BTN,
  SCROLLBAR_CLS,
  Segmented,
  errorMessage,
  fadeUp,
  isAuthLoss,
  toInternationalPhone,
} from "./admin-shared";

type VisitFilter = "UPCOMING" | "TODAY" | "PAST" | "ALL";

const VISIT_STATUS_META: Record<string, { label: string; chip: string }> = {
  PLANNED: { label: "Planned", chip: "bg-[#0F766E]/10 text-[#0B6B5D] border-[#0F766E]/30" },
  DONE: { label: "Completed", chip: "bg-[#34C759]/12 text-[#1E8E3E] border-[#34C759]/30" },
  NO_SHOW: { label: "No-show", chip: "bg-[#F59E0B]/12 text-[#B45309] border-[#F59E0B]/30" },
  CANCELLED: { label: "Cancelled", chip: "bg-black/[0.05] text-neutral-500 border-black/10" },
};

interface PropertyLite {
  id: string;
  title: string;
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminVisits({ api }: { api: AdminApi }) {
  const [state, setState] = useState<{ key: string; visits: SiteVisit[] } | null>(null);
  const [properties, setProperties] = useState<PropertyLite[]>([]);
  const [reload, setReload] = useState(0);
  const [filter, setFilter] = useState<VisitFilter>("UPCOMING");
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SiteVisit | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});

  /* ---------- form state ---------- */
  const [fName, setFName] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fArea, setFArea] = useState("none");
  const [fProperty, setFProperty] = useState("none");
  const [fWhen, setFWhen] = useState(() => toLocalInputValue(new Date(Date.now() + 86_400_000)));
  const [fNotes, setFNotes] = useState("");

  useEffect(() => {
    let alive = true;
    api<{ visits: SiteVisit[] }>("/api/admin/visits")
      .then((d) => {
        if (alive) setState({ key: String(Date.now()), visits: d.visits ?? [] });
      })
      .catch((err) => {
        if (!isAuthLoss(err) && alive) setLoadError(errorMessage(err));
      });
    api<{ properties: PropertyLite[] }>("/api/admin/properties?limit=300")
      .then((d) => {
        if (alive) setProperties(d.properties ?? []);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [reload]);

  const visits = state?.visits ?? [];

  const filtered = useMemo(() => {
    const now = new Date();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return visits.filter((v) => {
      const t = new Date(v.scheduledAt).getTime();
      switch (filter) {
        case "UPCOMING":
          return v.status === "PLANNED" && t >= now;
        case "TODAY":
          return t >= new Date(now).setHours(0, 0, 0, 0) && t <= endOfToday.getTime();
        case "PAST":
          return t < now;
        default:
          return true;
      }
    });
  }, [visits, filter]);

  const plannedCount = visits.filter((v) => v.status === "PLANNED").length;
  const todayCount = useMemo(() => {
    const now = new Date();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return visits.filter(
      (v) =>
        v.status === "PLANNED" &&
        new Date(v.scheduledAt).getTime() >= now.getTime() &&
        new Date(v.scheduledAt).getTime() <= endOfToday.getTime()
    ).length;
  }, [visits]);

  /* ---------- actions ---------- */
  const bookVisit = async () => {
    if (!fName.trim() || !fPhone.trim()) {
      toast.error("Customer name and phone are required.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/admin/visits", {
        method: "POST",
        body: JSON.stringify({
          name: fName,
          phone: fPhone,
          area: fArea === "none" ? null : fArea,
          propertyId: fProperty === "none" ? null : fProperty,
          scheduledAt: new Date(fWhen).toISOString(),
          notes: fNotes.trim() || null,
        }),
      });
      toast.success("Site visit booked");
      setFormOpen(false);
      setFName("");
      setFPhone("");
      setFArea("none");
      setFProperty("none");
      setFNotes("");
      setReload((n) => n + 1);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (visit: SiteVisit, status: string) => {
    try {
      await api(`/api/admin/visits/${visit.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(`Marked ${VISIT_STATUS_META[status]?.label ?? status}`);
      setReload((n) => n + 1);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    }
  };

  const saveVisitNotes = async (visit: SiteVisit) => {
    const notes = editNotes[visit.id];
    if (notes === undefined) return;
    try {
      await api(`/api/admin/visits/${visit.id}`, {
        method: "PATCH",
        body: JSON.stringify({ notes: notes.trim() || null }),
      });
      toast.success("Visit notes saved");
      setEditNotes((d) => {
        const next = { ...d };
        delete next[visit.id];
        return next;
      });
      setReload((n) => n + 1);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/api/admin/visits/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Visit removed");
      setDeleteTarget(null);
      setReload((n) => n + 1);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    }
  };

  const waLink = (phone: string) => `https://wa.me/${toInternationalPhone(phone)}`;

  return (
    <div className="pb-10">
      {/* Header */}
      <motion.div {...fadeUp} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900">Site visits</h1>
          <p className="mt-0.5 text-[12.5px] text-neutral-500">
            {plannedCount > 0
              ? `${plannedCount} planned · ${todayCount} today — show up, walk the file, close.`
              : "Book and track property viewings."}
          </p>
        </div>
        <Button
          onClick={() => setFormOpen((o) => !o)}
          className={cn("h-9 rounded-full px-4 text-[12.5px] font-semibold", BRAND_BTN)}
        >
          <CalendarPlus className="h-4 w-4" />
          {formOpen ? "Close form" : "Book a visit"}
        </Button>
      </motion.div>

      {/* Booking form */}
      {formOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <AdminCard className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11.5px] font-semibold text-neutral-500">
                  Customer name *
                </label>
                <Input
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="e.g. Ahmed Raza"
                  className="h-10 rounded-xl border-black/[0.08] text-[13px] focus-visible:ring-[#0F766E]/35"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-semibold text-neutral-500">
                  Phone *
                </label>
                <Input
                  value={fPhone}
                  onChange={(e) => setFPhone(e.target.value)}
                  placeholder="03xx xxxxxxx"
                  inputMode="tel"
                  className="h-10 rounded-xl border-black/[0.08] text-[13px] focus-visible:ring-[#0F766E]/35"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-semibold text-neutral-500">
                  Date & time *
                </label>
                <Input
                  type="datetime-local"
                  value={fWhen}
                  onChange={(e) => setFWhen(e.target.value)}
                  className="h-10 rounded-xl border-black/[0.08] text-[13px] focus-visible:ring-[#0F766E]/35"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-semibold text-neutral-500">Area</label>
                <Select value={fArea} onValueChange={setFArea}>
                  <SelectTrigger className="h-10 rounded-xl border-black/[0.08] text-[13px] focus-visible:ring-[#0F766E]/35">
                    <SelectValue placeholder="Any area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any area</SelectItem>
                    {AREAS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11.5px] font-semibold text-neutral-500">
                  Listing (optional)
                </label>
                <Select value={fProperty} onValueChange={setFProperty}>
                  <SelectTrigger className="h-10 rounded-xl border-black/[0.08] text-[13px] focus-visible:ring-[#0F766E]/35">
                    <SelectValue placeholder="No specific listing" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="none">No specific listing</SelectItem>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11.5px] font-semibold text-neutral-500">
                  Notes (optional)
                </label>
                <Textarea
                  rows={2}
                  value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)}
                  placeholder="Which files to show, meeting point, budget…"
                  className="resize-none rounded-xl border-black/[0.08] text-[13px] focus-visible:ring-[#0F766E]/35"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => void bookVisit()}
                disabled={busy}
                className={cn("h-9 rounded-full px-5 text-[12.5px] font-semibold", BRAND_BTN)}
              >
                {busy ? "Booking…" : "Confirm booking"}
              </Button>
            </div>
          </AdminCard>
        </motion.div>
      )}

      {/* Filter */}
      <motion.div {...fadeUp} className="mt-5">
        <Segmented
          layoutId="visits-filter"
          value={filter}
          onChange={(v) => setFilter(v)}
          options={[
            { value: "UPCOMING", label: "Upcoming" },
            { value: "TODAY", label: "Today", badge: todayCount },
            { value: "PAST", label: "Past" },
            { value: "ALL", label: "All" },
          ]}
        />
      </motion.div>

      {/* List */}
      <div className={cn("mt-4 space-y-3", SCROLLBAR_CLS)}>
        {loadError && (
          <AdminCard className="border-[#E5484D]/25 bg-[#E5484D]/[0.04]">
            <p className="text-[13px] font-medium text-[#D5303B]">{loadError}</p>
          </AdminCard>
        )}
        {!state && !loadError && (
          <>
            <Skeleton className="h-[150px] rounded-2xl" />
            <Skeleton className="h-[150px] rounded-2xl" />
          </>
        )}
        {state && filtered.length === 0 && (
          <AdminCard>
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CalendarClock className="h-7 w-7 text-neutral-300" />
              <p className="text-[13.5px] font-medium text-neutral-600">No visits here yet</p>
              <p className="max-w-xs text-[12.5px] text-neutral-400">
                Book a viewing for a customer — it will show up here with quick status actions.
              </p>
            </div>
          </AdminCard>
        )}
        {state &&
          filtered.map((visit, idx) => {
            const when = new Date(visit.scheduledAt);
            const time = when.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
            const day = when.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
            const isToday = new Date().toDateString() === when.toDateString();
            const notesValue = editNotes[visit.id] ?? visit.notes ?? "";
            const notesDirty = editNotes[visit.id] !== undefined && editNotes[visit.id] !== (visit.notes ?? "");
            const meta = VISIT_STATUS_META[visit.status] ?? VISIT_STATUS_META.PLANNED;
            return (
              <motion.article
                key={visit.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: Math.min(idx * 0.04, 0.3) }}
              >
                <AdminCard>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {/* date block */}
                    <div
                      className={cn(
                        "flex shrink-0 flex-row items-center justify-center gap-2 rounded-xl border px-4 py-2.5 sm:w-[104px] sm:flex-col sm:gap-0.5 sm:px-2 sm:py-3",
                        isToday && visit.status === "PLANNED"
                          ? "border-[#0F766E]/35 bg-[#E7F4F0]"
                          : "border-black/[0.06] bg-[#F7F9F8]"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[15px] font-bold leading-tight tabular-nums",
                          isToday && visit.status === "PLANNED" ? "text-[#0B6B5D]" : "text-neutral-800"
                        )}
                      >
                        {time}
                      </span>
                      <span className="text-[11px] font-medium text-neutral-500">
                        {isToday ? "Today" : day}
                      </span>
                    </div>

                    {/* body */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[14.5px] font-semibold tracking-tight text-neutral-900">
                          {visit.name}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold",
                            meta.chip
                          )}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {visit.phone}
                        </span>
                        {visit.area && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {visit.area}
                          </span>
                        )}
                        {visit.property?.title && (
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <UserRound className="h-3 w-3 shrink-0" />
                            <span className="truncate">{visit.property.title}</span>
                          </span>
                        )}
                      </div>

                      {/* quick status actions */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {visit.status !== "DONE" && (
                          <Button
                            size="sm"
                            onClick={() => void setStatus(visit, "DONE")}
                            className="h-7.5 rounded-full border border-[#34C759]/30 bg-[#34C759]/10 px-3 text-[11.5px] font-semibold text-[#1E8E3E] hover:bg-[#34C759]/20"
                          >
                            <Check className="h-3.5 w-3.5" /> Done
                          </Button>
                        )}
                        {visit.status !== "NO_SHOW" && (
                          <Button
                            size="sm"
                            onClick={() => void setStatus(visit, "NO_SHOW")}
                            className="h-7.5 rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 text-[11.5px] font-semibold text-[#B45309] hover:bg-[#F59E0B]/20"
                          >
                            <CircleSlash className="h-3.5 w-3.5" /> No-show
                          </Button>
                        )}
                        {visit.status !== "CANCELLED" && (
                          <Button
                            size="sm"
                            onClick={() => void setStatus(visit, "CANCELLED")}
                            className="h-7.5 rounded-full border border-black/10 bg-white px-3 text-[11.5px] font-semibold text-neutral-500 hover:bg-neutral-50"
                          >
                            <X className="h-3.5 w-3.5" /> Cancel
                          </Button>
                        )}
                        {visit.status !== "PLANNED" && (
                          <Button
                            size="sm"
                            onClick={() => void setStatus(visit, "PLANNED")}
                            className="h-7.5 rounded-full border border-[#0F766E]/30 bg-white px-3 text-[11.5px] font-semibold text-[#0B6B5D] hover:bg-[#E7F4F0]"
                          >
                            <Clock className="h-3.5 w-3.5" /> Re-plan
                          </Button>
                        )}
                        <a
                          href={waLink(visit.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-7.5 items-center gap-1.5 rounded-full border border-[#34C759]/30 bg-white px-3 text-[11.5px] font-semibold text-[#1E8E3E] transition-colors hover:bg-[#34C759]/10"
                        >
                          WhatsApp
                        </a>
                        <button
                          onClick={() => setDeleteTarget(visit)}
                          className="inline-flex h-7.5 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-medium text-neutral-400 transition-colors hover:text-[#E5484D]"
                          aria-label={`Delete visit for ${visit.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* notes */}
                      <div className="mt-3">
                        <Textarea
                          rows={1}
                          value={notesValue}
                          onChange={(e) =>
                            setEditNotes((d) => ({ ...d, [visit.id]: e.target.value }))
                          }
                          placeholder="Visit notes — what was shown, feedback, next step…"
                          aria-label={`Notes for visit of ${visit.name}`}
                          className="resize-none rounded-xl border-black/[0.08] text-[12.5px] focus-visible:ring-[#0F766E]/35"
                        />
                        {notesDirty && (
                          <div className="mt-2 flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => void saveVisitNotes(visit)}
                              className={cn("h-8 rounded-full px-4 text-[12px] font-semibold", BRAND_BTN)}
                            >
                              Save visit notes
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </AdminCard>
              </motion.article>
            );
          })}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl border-black/[0.06]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-900">Delete this visit?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13.5px] text-neutral-500">
              The visit for {deleteTarget?.name} ({deleteTarget?.phone}) will be removed. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-black/[0.09]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void doDelete()}
              className="rounded-xl bg-[#E5484D] text-white hover:bg-[#E5484D]/90"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
