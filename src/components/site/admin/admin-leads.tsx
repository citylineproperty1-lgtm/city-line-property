"use client";

/**
 * Leads tab — CRM inbox. Pipeline filter with counts, search, status chips,
 * WhatsApp delivery status + resend, notes, status PATCH, wa.me deep link.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  Building2,
  CalendarClock,
  CircleDollarSign,
  Download,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  NotebookPen,
  Phone,
  Quote,
  Search,
  Send,
  Trash2,
  BellPlus,
  CheckCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Lead, LeadActivity } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";
import { formatPKR } from "@/lib/format";
import {
  AdminApi,
  AdminCard,
  DUE_CHIP,
  BRAND_BTN,
  LEAD_STATUS_META,
  SCROLLBAR_CLS,
  SOURCE_LABELS,
  Segmented,
  StatusChip,
  WaChip,
  dueLabel,
  dueState,
  errorMessage,
  fadeUp,
  isAuthLoss,
  timeAgo,
  toInternationalPhone,
} from "./admin-shared";

type Pipeline = "ALL" | (typeof LEAD_STATUSES)[number];
type DueFilter = "ALL" | "overdue" | "today" | "scheduled";

const DAY_MS = 86_400_000;

/** Activity-type → dot color for the lead timeline. */
const ACTIVITY_DOT: Record<string, string> = {
  status: "#0F766E",
  note: "#8E8E93",
  followup: "#F59E0B",
  contacted: "#30B0C7",
  whatsapp: "#34C759",
  visit: "#AF52DE",
};

/** Compact CRM timeline — latest entries first, capped so cards stay scannable. */
function LeadTimeline({ activities }: { activities?: LeadActivity[] }) {
  const items = (activities ?? []).slice(-3).reverse();
  if (items.length === 0) return null;
  return (
    <div className="mt-3 border-t border-black/[0.05] pt-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
        Activity
      </p>
      <ul className="mt-1.5 space-y-1">
        {items.map((a, i) => (
          <li key={`${a.at}-${i}`} className="flex items-center gap-2 text-[11.5px] leading-snug">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: ACTIVITY_DOT[a.type] ?? "#8E8E93" }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-neutral-600" title={a.detail}>
              {a.detail}
            </span>
            <time
              className="shrink-0 text-[10.5px] tabular-nums text-neutral-400"
              dateTime={a.at}
              title={new Date(a.at).toLocaleString()}
            >
              {timeAgo(a.at)}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminLeads({ api }: { api: AdminApi }) {
  const [state, setState] = useState<{ key: string; leads: Lead[] } | null>(null);
  const [reload, setReload] = useState(0);
  const [qInput, setQInput] = useState("");
  const [pipeline, setPipeline] = useState<Pipeline>("ALL");
  const [due, setDue] = useState<DueFilter>("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const key = `leads-${reload}`;

  useEffect(() => {
    let alive = true;
    api<{ leads: Lead[] }>("/api/admin/leads")
      .then((d) => {
        if (alive) setState({ key, leads: d.leads });
      })
      .catch((err) => {
        if (!alive || isAuthLoss(err)) return;
        setLoadError(errorMessage(err));
        setState({ key, leads: [] });
      });
    return () => {
      alive = false;
    };
  }, [key, api]);

  const loading = !state || state.key !== key;
  const leads = state?.key === key ? state.leads : [];

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: leads.length };
    for (const s of LEAD_STATUSES) c[s] = 0;
    for (const l of leads) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [leads]);

  const q = qInput.trim().toLowerCase();
  const filtered = useMemo(() => {
    const list = leads.filter((l) => {
      if (pipeline !== "ALL" && l.status !== pipeline) return false;
      const ds = dueState(l.followUpAt);
      if (due === "overdue" && ds !== "overdue") return false;
      if (due === "today" && ds !== "today") return false;
      if (due === "scheduled" && !l.followUpAt) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q) ||
        (l.property?.title ?? "").toLowerCase().includes(q)
      );
    });
    // Reminder-driven views read best in due order (oldest first).
    if (due !== "ALL") {
      return [...list].sort(
        (a, b) =>
          new Date(a.followUpAt ?? 0).getTime() - new Date(b.followUpAt ?? 0).getTime()
      );
    }
    return list;
  }, [leads, pipeline, due, q]);

  const dueCounts = useMemo(() => {
    let overdue = 0;
    let today = 0;
    let scheduled = 0;
    for (const l of leads) {
      const ds = dueState(l.followUpAt);
      if (ds === "overdue") overdue++;
      if (ds === "today") today++;
      if (l.followUpAt) scheduled++;
    }
    return { overdue, today, scheduled };
  }, [leads]);

  const updateLead = (id: string, patch: Partial<Lead>) =>
    setState((prev) =>
      prev && prev.key === key
        ? { ...prev, leads: prev.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) }
        : prev
    );

  const setStatus = async (lead: Lead, status: string) => {
    setBusyId(lead.id);
    try {
      const d = await api<{ ok: boolean; activities?: LeadActivity[] }>(
        `/api/admin/leads/${lead.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );
      updateLead(lead.id, { status, ...(d.activities ? { activities: d.activities } : {}) });
      toast.success(`${lead.name} → ${LEAD_STATUS_META[status]?.label ?? status}`);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const saveNotes = async (lead: Lead) => {
    const notes = notesDrafts[lead.id];
    if (notes === undefined) return;
    setBusyId(lead.id);
    try {
      const d = await api<{ ok: boolean; activities?: LeadActivity[] }>(
        `/api/admin/leads/${lead.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ notes }),
        }
      );
      updateLead(lead.id, { notes, ...(d.activities ? { activities: d.activities } : {}) });
      setNotesDrafts((d) => {
        const next = { ...d };
        delete next[lead.id];
        return next;
      });
      toast.success("Notes saved");
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const resend = async (lead: Lead) => {
    setBusyId(lead.id);
    try {
      const d = await api<{ ok: boolean; waStatus: string; activities?: LeadActivity[] }>(
        `/api/admin/leads/${lead.id}/whatsapp`,
        { method: "POST" }
      );
      updateLead(lead.id, {
        waStatus: d.waStatus,
        waError: d.waStatus === "SENT" ? null : lead.waError,
        ...(d.activities ? { activities: d.activities } : {}),
      });
      if (d.waStatus === "SENT") toast.success("Lead pushed to WhatsApp");
      else if (d.waStatus === "SKIPPED") toast.info("No webhook configured — add one in Settings");
      else toast.error(`WhatsApp delivery failed (${d.waStatus})`);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async () => {
    const lead = deleteTarget;
    if (!lead) return;
    setBusyId(lead.id);
    try {
      await api(`/api/admin/leads/${lead.id}`, { method: "DELETE" });
      setState((prev) =>
        prev && prev.key === key ? { ...prev, leads: prev.leads.filter((l) => l.id !== lead.id) } : prev
      );
      toast.success(`Lead from ${lead.name} deleted`);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  };

  const openChat = (lead: Lead) => {
    const digits = toInternationalPhone(lead.phone);
    const text = `Assalam-o-Alaikum ${lead.name}, thank you for contacting City Line Property regarding your recent inquiry. How may we assist you further?`;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  /** Set/clear the follow-up reminder (and optionally stamp lastContactedAt). */
  const setFollowUp = async (lead: Lead, ms: number | null, markContacted = false) => {
    setBusyId(lead.id);
    try {
      const body: Record<string, string | null> = {
        followUpAt: ms == null ? null : new Date(ms).toISOString(),
        ...(markContacted ? { lastContactedAt: new Date().toISOString() } : {}),
      };
      await api(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      updateLead(lead.id, {
        followUpAt: ms == null ? null : new Date(ms).toISOString(),
        ...(markContacted ? { lastContactedAt: new Date().toISOString() } : {}),
      });
      if (ms == null && markContacted) toast.success(`Follow-up done — ${lead.name} marked contacted`);
      else if (ms != null) toast.success(`Reminder set for ${lead.name}`);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const remindInDays = (lead: Lead, days: number) =>
    setFollowUp(lead, Date.now() + days * DAY_MS);

  /** Export the currently filtered leads as a CSV file (Excel-friendly). */
  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.info("No leads to export in the current view");
      return;
    }
    const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const header = ["Date", "Name", "Phone", "Email", "Category", "Area", "Budget (PKR)", "Property", "Source", "Status", "WhatsApp", "Follow-up", "Last contacted", "Message"];
    const rows = filtered.map((l) =>
      [
        new Date(l.createdAt).toLocaleString("en-GB"),
        l.name,
        l.phone,
        l.email ?? "",
        l.category ?? "",
        l.area ?? "",
        l.budget ?? "",
        l.property?.title ?? "",
        l.source,
        l.status,
        l.waStatus,
        l.followUpAt ? new Date(l.followUpAt).toLocaleString("en-GB") : "",
        l.lastContactedAt ? new Date(l.lastContactedAt).toLocaleString("en-GB") : "",
        l.message,
      ]
        .map(esc)
        .join(",")
    );
    const csv = "\uFEFF" + [header.map(esc).join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cityline-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} lead(s) to CSV`);
  };

  const pipelineOptions = [
    { value: "ALL" as Pipeline, label: "All", badge: counts.ALL },
    ...LEAD_STATUSES.map((s) => ({
      value: s as Pipeline,
      label: LEAD_STATUS_META[s].label,
      dot: LEAD_STATUS_META[s].color,
      badge: counts[s],
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Pipeline + search */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.02 }}>
        <AdminCard className="p-4 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Segmented
              layoutId="leads-pipeline"
              options={pipelineOptions}
              value={pipeline}
              onChange={setPipeline}
            />
            <div className="flex items-center gap-2">
              <div className="relative lg:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder="Search name, phone, message…"
                  aria-label="Search leads"
                  className="h-10 rounded-xl border-black/[0.09] pl-9 text-[13.5px] focus-visible:ring-[#0F766E]/35"
                />
              </div>
              <Button
                variant="outline"
                onClick={exportCsv}
                className="h-10 shrink-0 rounded-xl border-black/[0.09] px-3 text-[12.5px] font-semibold text-neutral-600 hover:bg-neutral-50"
                aria-label="Export leads to CSV"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
          <p className="mt-2.5 text-[11.5px] text-neutral-400">
            {loading ? "Loading leads…" : `${filtered.length} of ${leads.length} leads shown`}
          </p>
          {/* Follow-up due filter */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-black/[0.05] pt-2.5">
            <CalendarClock className="h-3.5 w-3.5 text-[#0F766E]" />
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Follow-ups
            </span>
            {([
              { key: "ALL" as DueFilter, label: "All" },
              { key: "overdue" as DueFilter, label: "Overdue", badge: dueCounts.overdue, hot: dueCounts.overdue > 0 },
              { key: "today" as DueFilter, label: "Due today", badge: dueCounts.today, hot: dueCounts.today > 0 },
              { key: "scheduled" as DueFilter, label: "Scheduled", badge: dueCounts.scheduled },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setDue(f.key)}
                aria-pressed={due === f.key}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-all",
                  due === f.key
                    ? "brand-gradient text-white shadow-sm"
                    : "bg-black/[0.04] text-neutral-500 hover:bg-[#E7F4F0] hover:text-[#0B6B5D]"
                )}
              >
                {f.label}
                {f.badge != null && f.badge > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums",
                      due === f.key ? "bg-white/25 text-white" : f.hot ? "bg-[#FF3B30] text-white" : "bg-white text-neutral-500"
                    )}
                  >
                    {f.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </AdminCard>
      </motion.div>

      {loadError && (
        <p className="flex items-center gap-2 rounded-2xl border border-[#E5484D]/25 bg-[#E5484D]/[0.06] px-4 py-3 text-[13px] text-[#D5303B]">
          <AlertCircle className="h-4 w-4" /> {loadError}
        </p>
      )}

      {/* Lead cards */}
      <div
        className={`max-h-[72vh] space-y-3 overflow-y-auto pr-1 ${SCROLLBAR_CLS}`}
        aria-label="Leads list"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-3xl" />)
        ) : filtered.length === 0 ? (
          <AdminCard>
            <div className="flex flex-col items-center py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04]">
                <Inbox className="h-5 w-5 text-neutral-300" />
              </span>
              <p className="mt-3 text-[14px] font-semibold text-neutral-700">
                {pipeline === "ALL" && !q ? "No leads yet" : "Nothing here"}
              </p>
              <p className="mt-1 max-w-xs text-[12.5px] text-neutral-400">
                {pipeline === "ALL" && !q
                  ? "Requirement forms, listing inquiries and contact messages will land in this inbox."
                  : "No leads match this pipeline stage or search — try another filter."}
              </p>
            </div>
          </AdminCard>
        ) : (
          filtered.map((lead, i) => {
            const notesDraft = notesDrafts[lead.id];
            const notesValue = notesDraft ?? lead.notes ?? "";
            const notesDirty = notesDraft !== undefined && notesDraft !== (lead.notes ?? "");
            return (
              <motion.article
                key={lead.id}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: Math.min(i * 0.03, 0.15) }}
              >
                <AdminCard className="p-4 sm:p-5">
                  {/* Row 1: identity */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold tracking-tight text-neutral-900">
                          {lead.name}
                        </h3>
                        <StatusChip status={lead.status} />
                        {lead.followUpAt && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DUE_CHIP[dueState(lead.followUpAt) ?? "later"]}`}
                            title={`Follow-up ${dueLabel(lead.followUpAt)}`}
                          >
                            <CalendarClock className="mr-1 inline h-3 w-3 align-[-1px]" />
                            {dueLabel(lead.followUpAt)}
                          </span>
                        )}
                        <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                          {SOURCE_LABELS[lead.source] ?? lead.source}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-neutral-500">
                        <a
                          href={`tel:${lead.phone.replace(/\s/g, "")}`}
                          className="flex items-center gap-1.5 font-medium text-neutral-700 transition-colors hover:text-neutral-950"
                        >
                          <Phone className="h-3.5 w-3.5 text-neutral-400" />
                          {lead.phone}
                        </a>
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-1.5 transition-colors hover:text-neutral-900"
                          >
                            <Mail className="h-3.5 w-3.5 text-neutral-400" />
                            {lead.email}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <WaChip status={lead.waStatus} />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void resend(lead)}
                        disabled={busyId === lead.id}
                        className="h-8 rounded-full border border-black/[0.08] px-3 text-[11.5px] font-semibold text-neutral-600 hover:bg-[#E7F4F0] hover:text-[#0B6B5D]"
                      >
                        {busyId === lead.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Resend
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteTarget(lead)}
                        aria-label={`Delete lead from ${lead.name}`}
                        className="h-8 w-8 rounded-lg text-neutral-300 hover:bg-[#E5484D]/10 hover:text-[#E5484D]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {lead.waStatus === "FAILED" && lead.waError && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-[#E5484D]/[0.06] px-3 py-2 text-[11.5px] text-[#D5303B]">
                      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                      WhatsApp error: {lead.waError}
                    </p>
                  )}

                  {/* Row 2: interest */}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11.5px]">
                    {lead.category && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-1 font-medium text-neutral-600">
                        <Building2 className="h-3 w-3 text-neutral-400" />
                        {lead.category}
                      </span>
                    )}
                    {lead.area && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-1 font-medium text-neutral-600">
                        <MapPin className="h-3 w-3 text-neutral-400" />
                        {lead.area}
                      </span>
                    )}
                    {lead.budget != null && lead.budget > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F4F0] px-2.5 py-1 font-semibold text-[#0B6B5D]">
                        <CircleDollarSign className="h-3 w-3" />
                        Budget ~ {formatPKR(lead.budget)}
                      </span>
                    )}
                    {lead.property && (
                      <span className="inline-flex max-w-60 items-center gap-1 truncate rounded-full bg-black/[0.04] px-2.5 py-1 font-medium text-neutral-600">
                        <Building2 className="h-3 w-3 shrink-0 text-neutral-400" />
                        <span className="truncate">{lead.property.title}</span>
                      </span>
                    )}
                  </div>

                  {/* Row 3: message */}
                  <blockquote className="mt-3 rounded-2xl border-l-[3px] border-[#0F766E]/40 bg-neutral-50/70 px-3.5 py-2.5 text-[13px] leading-relaxed text-neutral-600">
                    <Quote className="mb-1 h-3.5 w-3.5 text-[#0F766E]/60" />
                    {lead.message}
                  </blockquote>

                  {/* Row 3.5: follow-up reminder */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-[#E7F4F0]/60 px-3 py-2">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[#0B6B5D]" />
                    {lead.followUpAt ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${DUE_CHIP[dueState(lead.followUpAt) ?? "later"]}`}
                      >
                        {dueLabel(lead.followUpAt)}
                      </span>
                    ) : (
                      <span className="text-[11.5px] font-medium text-neutral-400">No reminder set</span>
                    )}
                    <span className="flex flex-wrap items-center gap-1">
                      {[1, 3, 7].map((d) => (
                        <button
                          key={d}
                          onClick={() => void remindInDays(lead, d)}
                          disabled={busyId === lead.id}
                          title={`Remind me in ${d} day${d > 1 ? "s" : ""}`}
                          className="rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold text-[#0B6B5D] ring-1 ring-[#0F766E]/30 transition-all hover:bg-[#E7F4F0] disabled:opacity-50"
                        >
                          +{d}d
                        </button>
                      ))}
                    </span>
                    {lead.followUpAt && (
                      <span className="flex flex-wrap items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void setFollowUp(lead, null, true)}
                          disabled={busyId === lead.id}
                          className="h-7 rounded-full bg-white px-2.5 text-[10.5px] font-semibold text-[#1E8E3E] ring-1 ring-[#34C759]/35 hover:bg-[#34C759]/10"
                        >
                          <CheckCheck className="h-3 w-3" />
                          Done
                        </Button>
                        <button
                          onClick={() => void setFollowUp(lead, null)}
                          disabled={busyId === lead.id}
                          title="Clear reminder"
                          aria-label={`Clear reminder for ${lead.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-black/[0.05] hover:text-neutral-500 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )}
                    {!lead.followUpAt && (
                      <button
                        onClick={() => void setFollowUp(lead, null, true)}
                        disabled={busyId === lead.id}
                        className="ml-auto flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold text-neutral-500 ring-1 ring-black/[0.08] transition-all hover:text-[#1E8E3E] disabled:opacity-50"
                      >
                        <BellPlus className="h-3 w-3" />
                        Mark contacted now
                      </button>
                    )}
                    {lead.lastContactedAt && (
                      <span className="text-[10.5px] font-medium text-neutral-400">
                        · contacted {timeAgo(lead.lastContactedAt)}
                      </span>
                    )}
                  </div>

                  {/* Row 4: pipeline + actions */}
                  <div className="mt-3.5 flex flex-col gap-3 border-t border-black/[0.05] pt-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={lead.status}
                        onValueChange={(v) => void setStatus(lead, v)}
                        disabled={busyId === lead.id}
                      >
                        <SelectTrigger
                          aria-label={`Pipeline stage for ${lead.name}`}
                          className={`h-8 w-[150px] rounded-full border px-3 text-[11.5px] font-semibold ${
                            LEAD_STATUS_META[lead.status]?.chip ?? ""
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: LEAD_STATUS_META[s].color }}
                                />
                                {LEAD_STATUS_META[s].label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => openChat(lead)}
                        variant="outline"
                        className="h-8 rounded-full border-black/[0.09] px-3.5 text-[12px] font-semibold text-[#1E8E3E] hover:bg-[#34C759]/10"
                      >
                        <Phone className="h-3.5 w-3.5" /> Open customer chat
                      </Button>
                      <time
                        className="flex items-center gap-1 text-[11px] text-neutral-400"
                        dateTime={lead.createdAt}
                        title={new Date(lead.createdAt).toLocaleString()}
                      >
                        <CalendarClock className="h-3 w-3" />
                        {timeAgo(lead.createdAt)}
                      </time>
                    </div>
                  </div>

                  {/* Row 5: notes */}
                  <div className="mt-3">
                    <div className="relative">
                      <NotebookPen className="absolute left-3 top-3 h-3.5 w-3.5 text-neutral-400" />
                      <Textarea
                        rows={2}
                        value={notesValue}
                        onChange={(e) =>
                          setNotesDrafts((d) => ({ ...d, [lead.id]: e.target.value }))
                        }
                        placeholder="Internal notes — call outcomes, viewing times, offers…"
                        aria-label={`Notes for ${lead.name}`}
                        className="resize-none rounded-xl border-black/[0.08] pl-9 text-[12.5px] focus-visible:ring-[#0F766E]/35"
                      />
                    </div>
                    {notesDirty && (
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => void saveNotes(lead)}
                          disabled={busyId === lead.id}
                          className={`h-8 rounded-full px-4 text-[12px] font-semibold ${BRAND_BTN}`}
                        >
                          {busyId === lead.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Save notes"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Row 6: activity timeline */}
                  <LeadTimeline activities={lead.activities} />
                </AdminCard>
              </motion.article>
            );
          })
        )}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl border-black/[0.06]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-900">Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13.5px] text-neutral-500">
              {deleteTarget?.name} ({deleteTarget?.phone}) will be removed from the CRM. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-black/[0.09]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void doDelete()}
              disabled={busyId === deleteTarget?.id}
              className="rounded-xl bg-[#E5484D] text-white hover:bg-[#E5484D]/90"
            >
              <Trash2 className="h-4 w-4" /> Delete lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
