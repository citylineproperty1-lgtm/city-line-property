"use client";

/**
 * Admin overview tab — KPIs, inventory by category, listings by area,
 * recent leads. Data: GET /api/admin/overview.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  Mail,
  MessageCircle,
  Trophy,
  UserPlus,
  AlertCircle,
  Phone,
  TrendingUp,
  Eye,
  CalendarClock,
  CalendarCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AdminApi,
  AdminCard,
  DUE_CHIP,
  SCROLLBAR_CLS,
  StatusChip,
  WaChip,
  SOURCE_LABELS,
  StatCard,
  dueLabel,
  dueState,
  fadeUp,
  isAuthLoss,
  timeAgo,
  errorMessage,
} from "./admin-shared";

interface Overview {
  properties: {
    total: number;
    published: number;
    available: number;
    reserved: number;
    sold: number;
    rented: number;
    featured: number;
  };
  leads: {
    total: number;
    new: number;
    contacted: number;
    siteVisits: number;
    negotiation: number;
    won: number;
    lost: number;
  };
  whatsapp: { sent: number; failed: number };
  byCategory: { slug: string; name: string; color: string; count: number }[];
  byArea: { area: string; count: number }[];
  leadTrend: { label: string; count: number }[];
  followUps: {
    overdue: number;
    today: number;
    upcoming: {
      id: string;
      name: string;
      phone: string;
      followUpAt: string;
      status: string;
    }[];
  };
  recentLeads: {
    id: string;
    name: string;
    phone: string;
    message: string;
    status: string;
    waStatus: string;
    source: string;
    property: string | null;
    createdAt: string;
  }[];
}

export function AdminOverview({
  api,
  onOpenLeads,
}: {
  api: AdminApi;
  onOpenLeads?: () => void;
}) {
  const [state, setState] = useState<{ key: string; data: Overview } | null>(null);
  const [reload, setReload] = useState(0);
  const [failed, setFailed] = useState<string | null>(null);
  const key = `overview-${reload}`;

  useEffect(() => {
    let alive = true;
    api<{ overview: Overview }>("/api/admin/overview")
      .then((d) => {
        if (alive) setState({ key, data: d.overview });
      })
      .catch((err) => {
        if (!alive || isAuthLoss(err)) return;
        setFailed(errorMessage(err));
        setState({ key, data: EMPTY });
      });
    return () => {
      alive = false;
    };
  }, [key, api]);

  const loading = !state || state.key !== key;
  const o = state?.key === key ? state.data : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }

  if (!o) return null;
  const maxCat = Math.max(1, ...o.byCategory.map((c) => c.count));
  const maxArea = Math.max(1, ...o.byArea.map((a) => a.count));
  const leads14 = o.leadTrend.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-5">
      {failed && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#FF3B30]/25 bg-[#FF3B30]/[0.06] px-4 py-3 text-[13px] text-[#C0392B]">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {failed}
          </span>
          <button onClick={() => setReload((r) => r + 1)} className="font-semibold underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total listings"
          value={o.properties.total}
          icon={Building2}
          hint={`${o.properties.published} published · ${o.properties.featured} featured`}
          delay={0}
        />
        <StatCard
          label="Available"
          value={o.properties.available}
          icon={CheckCircle2}
          hint={
            <span className="tabular-nums">
              {o.properties.reserved} reserved · {o.properties.sold} sold · {o.properties.rented} rented
            </span>
          }
          delay={0.04}
        />
        <StatCard
          label="New leads"
          value={o.leads.new}
          icon={UserPlus}
          hint={`${o.leads.total} total in pipeline`}
          highlight
          delay={0.08}
        />
        <StatCard
          label="Won leads"
          value={o.leads.won}
          icon={Trophy}
          hint={`${o.leads.lost} lost · ${o.leads.siteVisits + o.leads.negotiation} active`}
          delay={0.12}
        />
        <StatCard
          label="WhatsApp sent"
          value={o.whatsapp.sent}
          icon={MessageCircle}
          hint={o.whatsapp.failed > 0 ? `${o.whatsapp.failed} failed — check Leads` : "All deliveries healthy"}
          delay={0.16}
        />
        <StatCard
          label="Site visits booked"
          value={o.leads.siteVisits}
          icon={CalendarCheck}
          hint={`${o.leads.negotiation} in negotiation`}
          delay={0.2}
        />
      </div>

      {/* 14-day traffic + lead trend */}
      <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.06 }}>
        <AdminCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900">
                <TrendingUp className="h-4 w-4 text-[#C9A227]" />
                Last 14 days
              </h3>
              <p className="mt-0.5 text-[12px] text-neutral-400">New leads captured, day by day.</p>
            </div>
            <div className="flex items-center gap-4 text-[11.5px] font-medium text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#0F766E]" /> Leads
                <b className="tabular-nums text-neutral-800">{leads14}</b>
              </span>
            </div>
          </div>
          <TrendChart data={o.leadTrend} />
        </AdminCard>
      </motion.section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Leads pipeline funnel */}
        <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
          <AdminCard className="h-full">
            <h3 className="text-[15px] font-semibold text-neutral-900">Leads pipeline</h3>
            {o.leads.total === 0 ? (
              <EmptyLine text="No leads yet — website inquiries will appear here." />
            ) : (
              <div className="mt-5 space-y-2.5">
                {[
                  { key: "NEW", label: "New", count: o.leads.new, color: "#C9A227" },
                  { key: "CONTACTED", label: "Contacted", count: o.leads.contacted, color: "#30B0C7" },
                  { key: "SITE_VISIT", label: "Site visit", count: o.leads.siteVisits, color: "#AF52DE" },
                  { key: "NEGOTIATION", label: "Negotiation", count: o.leads.negotiation, color: "#FF9500" },
                  { key: "WON", label: "Won", count: o.leads.won, color: "#34C759" },
                  { key: "LOST", label: "Lost", count: o.leads.lost, color: "#FF3B30" },
                ].map((s, i) => (
                  <div key={s.key} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-right text-[12px] font-medium text-neutral-500">{s.label}</span>
                    <div className="h-7 flex-1 overflow-hidden rounded-lg bg-black/[0.04]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: s.count === 0 ? "0%" : `${Math.max(6, (s.count / Math.max(1, o.leads.total)) * 100)}%` }}
                        transition={{ duration: 0.65, ease: "easeOut", delay: 0.12 + i * 0.06 }}
                        className="flex h-full items-center justify-end rounded-lg pr-2"
                        style={{
                          background: `linear-gradient(90deg, ${s.color}CC, ${s.color})`,
                          minWidth: s.count > 0 ? 28 : 0,
                        }}
                      >
                        {s.count > 0 && (
                          <span className="text-[10.5px] font-bold tabular-nums text-white">{s.count}</span>
                        )}
                      </motion.div>
                    </div>
                  </div>
                ))}
                <p className="pt-1 text-right text-[11px] text-neutral-400">
                  {o.leads.total > 0
                    ? `${Math.round((o.leads.won / o.leads.total) * 100)}% win rate`
                    : "—"}
                </p>
              </div>
            )}
          </AdminCard>
        </motion.section>

        {/* Inventory by category */}
        <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
          <AdminCard className="h-full">
            <h3 className="text-[15px] font-semibold text-neutral-900">Inventory by category</h3>
            {o.byCategory.length === 0 ? (
              <EmptyLine text="No listings yet." />
            ) : (
              <ul className="mt-4 space-y-3.5">
                {o.byCategory.map((c, i) => (
                  <li key={c.slug}>
                    <div className="flex items-center justify-between text-[12.5px]">
                      <span className="flex items-center gap-2 font-medium text-neutral-700">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                          aria-hidden
                        />
                        {c.name}
                      </span>
                      <span className="font-semibold tabular-nums text-neutral-500">{c.count}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/[0.05]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(c.count / maxCat) * 100}%` }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 + i * 0.05 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </motion.section>

        {/* Listings by area */}
        <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}>
          <AdminCard className="h-full">
            <h3 className="text-[15px] font-semibold text-neutral-900">Listings by area</h3>
            {o.byArea.length === 0 ? (
              <EmptyLine text="No listings yet." />
            ) : (
              <ul className="mt-4 space-y-3.5">
                {o.byArea.map((a, i) => (
                  <li key={a.area}>
                    <div className="flex items-center justify-between text-[12.5px]">
                      <span className="font-medium text-neutral-700">{a.area}</span>
                      <span className="font-semibold tabular-nums text-neutral-500">{a.count}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/[0.05]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(a.count / maxArea) * 100}%` }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 + i * 0.05 }}
                        className="h-full rounded-full bg-[linear-gradient(90deg,#DCB94F,#C9A227)]"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </motion.section>

        {/* Follow-up reminders */}
        <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.18 }}>
          <AdminCard className="h-full">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900">
                <CalendarClock className="h-4 w-4 text-[#C9A227]" />
                Follow-ups due
              </h3>
              {onOpenLeads && (o.followUps.overdue > 0 || o.followUps.today > 0) && (
                <button
                  onClick={onOpenLeads}
                  className="rounded-full bg-[#F5EDD7] px-3 py-1 text-[11px] font-semibold text-[#8A7119] transition-colors hover:bg-[#F0E4BE]"
                >
                  Open Leads
                </button>
              )}
            </div>
            {o.followUps.overdue === 0 && o.followUps.today === 0 && o.followUps.upcoming.length === 0 ? (
              <EmptyLine text="No reminders scheduled — set them from any lead card." />
            ) : (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3",
                      o.followUps.overdue > 0
                        ? "bg-[#FF3B30]/[0.08] ring-1 ring-[#FF3B30]/25"
                        : "bg-black/[0.03]"
                    )}
                  >
                    <p
                      className={cn(
                        "text-xl font-bold tabular-nums",
                        o.followUps.overdue > 0 ? "text-[#C0392B]" : "text-neutral-400"
                      )}
                    >
                      {o.followUps.overdue}
                    </p>
                    <p className="text-[11px] font-medium text-neutral-400">overdue</p>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3",
                      o.followUps.today > 0
                        ? "bg-[linear-gradient(135deg,rgba(233,206,122,0.28),rgba(201,162,39,0.16))] ring-1 ring-[#C9A227]/30"
                        : "bg-black/[0.03]"
                    )}
                  >
                    <p
                      className={cn(
                        "text-xl font-bold tabular-nums",
                        o.followUps.today > 0 ? "text-[#8A7119]" : "text-neutral-400"
                      )}
                    >
                      {o.followUps.today}
                    </p>
                    <p className="text-[11px] font-medium text-neutral-400">due today</p>
                  </div>
                </div>
                {o.followUps.upcoming.length > 0 && (
                  <ul className="mt-3 space-y-1.5" aria-label="Next follow-ups">
                    {o.followUps.upcoming.slice(0, 3).map((u) => (
                      <li
                        key={u.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-neutral-50/80 px-3 py-2 text-[12px]"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Phone className="h-3 w-3 shrink-0 text-neutral-400" />
                          <span className="truncate font-semibold text-neutral-700">{u.name}</span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                            DUE_CHIP[dueState(u.followUpAt) ?? "later"]
                          )}
                        >
                          {dueLabel(u.followUpAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </AdminCard>
        </motion.section>
      </div>

      {/* Recent leads */}
      <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}>
        <AdminCard>
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-neutral-900">Recent leads</h3>
            <span className="rounded-full bg-black/[0.05] px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-neutral-500">
              latest {o.recentLeads.length}
            </span>
          </div>
          {o.recentLeads.length === 0 ? (
            <EmptyLine text="No leads yet — website inquiries will appear here." />
          ) : (
            <ul
              className={`mt-4 max-h-96 space-y-2.5 overflow-y-auto pr-1 ${SCROLLBAR_CLS}`}
              aria-label="Recent leads"
            >
              {o.recentLeads.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-black/[0.05] bg-neutral-50/60 px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[13.5px] font-semibold text-neutral-900">{l.name}</p>
                      <StatusChip status={l.status} />
                      <WaChip status={l.waStatus} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-neutral-400">
                      <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="flex items-center gap-1 hover:text-neutral-700">
                        <Phone className="h-3 w-3" />
                        {l.phone}
                      </a>
                      <span className="rounded-full bg-black/[0.05] px-2 py-0.5 font-medium text-neutral-500">
                        {SOURCE_LABELS[l.source] ?? l.source}
                      </span>
                      {l.property && (
                        <span className="max-w-52 truncate rounded-full bg-[#C9A227]/10 px-2 py-0.5 font-medium text-[#8A7119]">
                          {l.property}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-[12px] text-neutral-500">&ldquo;{l.message}&rdquo;</p>
                  </div>
                  <time className="shrink-0 text-[11px] text-neutral-400" dateTime={l.createdAt}>
                    {timeAgo(l.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </motion.section>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="mt-4 rounded-xl bg-neutral-50/70 px-4 py-6 text-center text-[12.5px] text-neutral-400">{text}</p>;
}

/** Single-series SVG chart: emerald leads (area + line), 14 days. */
function TrendChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  const W = 560;
  const H = 170;
  const PAD_X = 10;
  const PAD_TOP = 14;
  const PAD_BOTTOM = 26;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const max = Math.max(1, ...data.map((v) => v.count));
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;
  const px = (i: number) => PAD_X + i * step;
  const py = (c: number) => PAD_TOP + innerH - (c / max) * innerH;

  const linePath = () =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(d.count).toFixed(1)}`).join(" ");
  const areaPath =
    `${linePath()} L${px(data.length - 1).toFixed(1)},${(PAD_TOP + innerH).toFixed(1)} L${px(0).toFixed(1)},${
      PAD_TOP + innerH
    } Z`;

  const peakIdx = data.reduce((best, d, i) => (d.count > data[best].count ? i : best), 0);
  const total = data.reduce((a, b) => a + b.count, 0);

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full" role="img" aria-label="New leads over the last 14 days">
        <defs>
          <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F766E" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_TOP + innerH * f}
            y2={PAD_TOP + innerH * f}
            stroke="rgba(0,0,0,0.06)"
            strokeDasharray="3 5"
          />
        ))}
        <motion.path
          d={areaPath}
          fill="url(#leadsFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <motion.path
          d={linePath()}
          fill="none"
          stroke="#0F766E"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
        />
        {data.map((d, i) =>
          i === peakIdx && d.count > 0 ? (
            <g key={i}>
              <circle cx={px(i)} cy={py(d.count)} r="4.5" fill="#0F766E" stroke="#fff" strokeWidth="2" />
            </g>
          ) : null
        )}
        {data.map((d, i) =>
          i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2) ? (
            <text
              key={i}
              x={px(i)}
              y={H - 8}
              textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
              className="fill-neutral-400"
              fontSize="10"
            >
              {d.label}
            </text>
          ) : null
        )}
      </svg>
      {total === 0 && (
        <p className="-mt-24 flex items-center justify-center gap-2 text-[12.5px] text-neutral-400">
          <Eye className="h-4 w-4" /> No leads in the last 14 days yet.
        </p>
      )}
    </div>
  );
}

const EMPTY: Overview = {
  properties: { total: 0, published: 0, available: 0, reserved: 0, sold: 0, rented: 0, featured: 0 },
  leads: { total: 0, new: 0, contacted: 0, siteVisits: 0, negotiation: 0, won: 0, lost: 0 },
  whatsapp: { sent: 0, failed: 0 },
  byCategory: [],
  byArea: [],
  leadTrend: [],
  followUps: { overdue: 0, today: 0, upcoming: [] },
  recentLeads: [],
};
