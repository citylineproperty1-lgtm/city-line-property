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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminApi,
  AdminCard,
  SCROLLBAR_CLS,
  StatusChip,
  WaChip,
  SOURCE_LABELS,
  StatCard,
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
  subscribers: number;
  agents: number;
  byCategory: { slug: string; name: string; color: string; count: number }[];
  byArea: { area: string; count: number }[];
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

export function AdminOverview({ api }: { api: AdminApi }) {
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
          label="Subscribers"
          value={o.subscribers}
          icon={Mail}
          hint={`${o.agents} team agents`}
          delay={0.2}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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

const EMPTY: Overview = {
  properties: { total: 0, published: 0, available: 0, reserved: 0, sold: 0, rented: 0, featured: 0 },
  leads: { total: 0, new: 0, contacted: 0, siteVisits: 0, negotiation: 0, won: 0, lost: 0 },
  whatsapp: { sent: 0, failed: 0 },
  subscribers: 0,
  agents: 0,
  byCategory: [],
  byArea: [],
  recentLeads: [],
};
