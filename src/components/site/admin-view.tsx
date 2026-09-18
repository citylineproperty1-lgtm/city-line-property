"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import {
  Inbox,
  Mail,
  Phone,
  Eye,
  Calculator,
  Home,
  MessageSquare,
  ArrowLeftRight,
  Users,
  CheckCircle2,
  Circle,
  Clock3,
  CheckCheck,
  RotateCcw,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InquiryItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  kind: string;
  message: string;
  status: string;
  createdAt: string;
  property: { id: string; title: string; slug: string } | null;
}

interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

const KIND_META: Record<string, { label: string; icon: typeof Home; className: string }> = {
  VIEWING: { label: "Viewing request", icon: Eye, className: "bg-emerald-50 text-emerald-700" },
  VALUATION: { label: "Valuation", icon: Calculator, className: "bg-amber-50 text-amber-700" },
  SELL: { label: "Selling", icon: Home, className: "bg-rose-50 text-rose-700" },
  GENERAL: { label: "General", icon: MessageSquare, className: "bg-neutral-100 text-neutral-600" },
};

const STATUS_META: Record<string, { label: string; icon: typeof Circle; className: string; next: string; nextLabel: string }> = {
  NEW: {
    label: "New",
    icon: Circle,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    next: "CONTACTED",
    nextLabel: "Mark contacted",
  },
  CONTACTED: {
    label: "Contacted",
    icon: Clock3,
    className: "bg-amber-50 text-amber-700 border-amber-200",
    next: "CLOSED",
    nextLabel: "Mark closed",
  },
  CLOSED: {
    label: "Closed",
    icon: CheckCheck,
    className: "bg-neutral-100 text-neutral-500 border-neutral-200",
    next: "NEW",
    nextLabel: "Reopen",
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

export function AdminView() {
  const { navigate } = useAppStore();
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "NEW" | "CONTACTED" | "CLOSED">("ALL");

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/inquiries").then((r) => r.json()),
      fetch("/api/newsletter").then((r) => r.json()),
    ])
      .then(([inq, news]) => {
        if (!alive) return;
        setInquiries(inq.inquiries ?? []);
        setSubscribers(news.subscribers ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const setStatus = async (item: InquiryItem, status: string) => {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/inquiries/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      setInquiries((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)));
      toast.success(`${item.name}'s inquiry → ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const counts = {
    all: inquiries.length,
    NEW: inquiries.filter((i) => i.status === "NEW").length,
    CONTACTED: inquiries.filter((i) => i.status === "CONTACTED").length,
    CLOSED: inquiries.filter((i) => i.status === "CLOSED").length,
  };

  const filtered = filter === "ALL" ? inquiries : inquiries.filter((i) => i.status === filter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900 text-white">
          <Inbox className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Team inbox
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Internal view — every inquiry and subscriber in one place.
          </p>
        </div>
      </div>

      {/* KPI chips */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "New inquiries", value: counts.NEW, icon: Circle, accent: "text-emerald-600" },
          { label: "In progress", value: counts.CONTACTED, icon: Clock3, accent: "text-amber-600" },
          { label: "Closed", value: counts.CLOSED, icon: CheckCheck, accent: "text-neutral-500" },
          { label: "Digest subscribers", value: subscribers.length, icon: Users, accent: "text-rose-500" },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.05 }}
            className="rounded-2xl border border-neutral-200/80 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-2xl font-semibold tracking-tight text-neutral-900 tabular-nums">
                {loading ? "—" : k.value}
              </p>
              <k.icon className={cn("h-4.5 w-4.5", k.accent)} />
            </div>
            <p className="mt-1 text-[12.5px] font-medium text-neutral-500">{k.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Inquiries */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-neutral-900">
              Inquiries
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[12px] font-semibold text-neutral-500">
                {counts.all}
              </span>
            </h2>
            {/* status filter */}
            <div className="flex rounded-full bg-neutral-100 p-1">
              {(["ALL", "NEW", "CONTACTED", "CLOSED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium transition-all",
                    filter === s ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                  )}
                >
                  {s === "ALL" ? "All" : STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/60 py-16 text-center">
                <Inbox className="h-8 w-8 text-neutral-300" />
                <p className="mt-3 text-[14.5px] font-medium text-neutral-700">
                  {filter === "ALL" ? "No inquiries yet" : `No ${STATUS_META[filter].label.toLowerCase()} inquiries`}
                </p>
                <p className="mt-1 max-w-xs text-[13px] text-neutral-500">
                  Client messages from property viewings, valuations and the contact
                  form will land here.
                </p>
              </div>
            ) : (
              filtered.map((item, i) => {
                const kind = KIND_META[item.kind] ?? KIND_META.GENERAL;
                const status = STATUS_META[item.status] ?? STATUS_META.NEW;
                return (
                  <motion.article
                    key={item.id}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: Math.min(i * 0.04, 0.2) }}
                    className="rounded-2xl border border-neutral-200/80 bg-white p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", kind.className)}>
                        <kind.icon className="h-3 w-3" />
                        {kind.label}
                      </span>
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", status.className)}>
                        <status.icon className="h-3 w-3" />
                        {status.label}
                      </span>
                      <span className="ml-auto text-[11.5px] text-neutral-400">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <p className="mt-3 text-[15px] font-semibold text-neutral-900">{item.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-neutral-500">
                      <a href={`mailto:${item.email}`} className="flex items-center gap-1.5 transition-colors hover:text-neutral-900">
                        <Mail className="h-3 w-3 text-neutral-400" />
                        {item.email}
                      </a>
                      {item.phone && (
                        <a href={`tel:${item.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 transition-colors hover:text-neutral-900">
                          <Phone className="h-3 w-3 text-neutral-400" />
                          {item.phone}
                        </a>
                      )}
                    </div>

                    {item.property && (
                      <button
                        onClick={() => navigate({ name: "property", id: item.property!.id })}
                        className="mt-3 flex items-center gap-1.5 rounded-full bg-neutral-50 px-3 py-1.5 text-[12px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                      >
                        <Building2 className="h-3 w-3 text-neutral-400" />
                        {item.property.title}
                        <ArrowLeftRight className="h-3 w-3 rotate-90 text-neutral-300" />
                      </button>
                    )}

                    <p className="mt-3 rounded-xl bg-neutral-50/70 p-3 text-[13px] leading-relaxed text-neutral-600">
                      &ldquo;{item.message}&rdquo;
                    </p>

                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-neutral-100 pt-3.5">
                      <button
                        onClick={() => setStatus(item, status.next)}
                        disabled={busyId === item.id}
                        className={cn(
                          "flex h-9 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-semibold transition-all disabled:opacity-50",
                          item.status === "CLOSED"
                            ? "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                            : "bg-neutral-900 text-white hover:bg-neutral-700"
                        )}
                      >
                        {item.status === "CLOSED" ? (
                          <RotateCcw className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        {status.nextLabel}
                      </button>
                    </div>
                  </motion.article>
                );
              })
            )}
          </div>
        </section>

        {/* Subscribers */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900">
                <Users className="h-4 w-4 text-neutral-400" />
                Digest subscribers
              </h2>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11.5px] font-semibold text-rose-600">
                {subscribers.length}
              </span>
            </div>
            {loading ? (
              <div className="mt-4 space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-9 rounded-full" />
                ))}
              </div>
            ) : subscribers.length === 0 ? (
              <p className="mt-4 rounded-xl bg-neutral-50/70 p-4 text-center text-[12.5px] leading-relaxed text-neutral-400">
                No subscribers yet — the footer newsletter form feeds this list.
              </p>
            ) : (
              <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {subscribers.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-full bg-neutral-50 px-3.5 py-2"
                  >
                    <span className="truncate text-[12.5px] font-medium text-neutral-700">
                      {s.email}
                    </span>
                    <span className="shrink-0 text-[10.5px] text-neutral-400">
                      {formatDate(s.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/60 p-5">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-neutral-400">
              Internal tool
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">
              This inbox is a staff-only demo surface — hook it to your CRM or add
              authentication before real deployment.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
