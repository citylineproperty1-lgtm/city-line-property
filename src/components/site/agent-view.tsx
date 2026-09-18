"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCard } from "@/components/site/property-card";
import { useAppStore } from "@/lib/store";
import { categoryLabel, type Property, type Agent } from "@/lib/types";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  BadgeCheck,
  Building2,
  Star,
  UserRound,
} from "lucide-react";

interface AgentWithCount extends Agent {
  listingCount?: number;
}

export function AgentView({ id }: { id: string }) {
  const { navigate } = useAppStore();
  const [state, setState] = useState<{
    key: string;
    agent: AgentWithCount | null;
    listings: Property[];
    notFound: boolean;
  }>({ key: "", agent: null, listings: [], notFound: false });
  const loading = state.key !== id;
  const { agent, listings, notFound } = state;

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`/api/agents/${id}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error("nf")))),
      fetch(`/api/properties?agentId=${id}&limit=60`).then((r) => r.json()),
    ])
      .then(([a, p]) => {
        if (alive)
          setState({
            key: id,
            agent: a.agent ?? null,
            listings: p.properties ?? [],
            notFound: false,
          });
      })
      .catch(() => {
        if (alive) setState({ key: id, agent: null, listings: [], notFound: true });
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const stats = useMemo(() => {
    if (listings.length === 0) return null;
    const sale = listings.filter((l) => l.status === "SALE").length;
    const rent = listings.length - sale;
    const avgRating =
      listings.reduce((sum, l) => sum + l.rating, 0) / listings.length;
    const districts = new Set(listings.map((l) => l.district));
    return { sale, rent, avgRating, districts: districts.size };
  }, [listings]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Skeleton className="h-9 w-40 rounded-full" />
        <div className="mt-8 flex flex-col items-center gap-5 rounded-3xl border border-neutral-200/80 p-10 sm:flex-row sm:items-start sm:text-left">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <Skeleton className="mx-auto h-7 w-56 sm:mx-0" />
            <Skeleton className="mx-auto h-4 w-40 sm:mx-0" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !agent) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-28 text-center sm:px-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
          <UserRound className="h-6 w-6 text-neutral-400" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Agent not found</h1>
        <p className="mt-2 max-w-sm text-sm text-neutral-500">
          This profile may have been removed or the link is out of date.
        </p>
        <Button
          onClick={() => navigate({ name: "about" })}
          className="mt-6 h-11 rounded-full bg-neutral-900 px-6 text-sm hover:bg-neutral-700"
        >
          Meet the full team
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <button
        onClick={() => navigate({ name: "about" })}
        className="group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        All agents
      </button>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mt-4 overflow-hidden rounded-3xl border border-neutral-200/80 bg-white"
      >
        <div className="h-28 bg-neutral-900 sm:h-32">
          <div className="bg-dots h-full w-full opacity-20" />
        </div>
        <div className="relative px-6 pb-7 sm:px-10">
          <span
            className="absolute -top-12 left-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white text-2xl font-semibold text-white shadow-lg sm:left-10"
            style={{ backgroundColor: agent.accent }}
          >
            {agent.initials}
          </span>
          <div className="flex flex-col gap-5 pt-16 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                  {agent.name}
                </h1>
                <BadgeCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-1 text-[14.5px] font-medium text-emerald-700">{agent.title}</p>
            </div>
            <div className="flex gap-2">
              <a
                href={`tel:${agent.phone.replace(/\s/g, "")}`}
                className="flex h-10 items-center gap-2 rounded-full border border-neutral-200 px-4 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </a>
              <a
                href={`mailto:${agent.email}`}
                className="flex h-10 items-center gap-2 rounded-full bg-neutral-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-neutral-700"
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </a>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-[14.5px] leading-relaxed text-neutral-600">
            {agent.bio}
          </p>

          {/* Contact rows */}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-neutral-400" />
              {agent.phone}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-neutral-400" />
              {agent.email}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-neutral-400" />
              DHA Phase 6, Karachi
            </span>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-200/60 sm:grid-cols-4">
              {[
                {
                  icon: Building2,
                  label: "Active listings",
                  value: String(agent.listingCount ?? listings.length),
                },
                { icon: Building2, label: "For sale", value: String(stats.sale) },
                { icon: Building2, label: "For rent", value: String(stats.rent) },
                {
                  icon: Star,
                  label: "Avg. rating",
                  value: stats.avgRating.toFixed(1),
                },
              ].map((s) => (
                <div key={s.label} className="bg-white px-5 py-4">
                  <s.icon className="h-4 w-4 text-neutral-400" />
                  <p className="mt-1.5 text-lg font-semibold tracking-tight text-neutral-900">
                    {s.value}
                  </p>
                  <p className="text-[12px] text-neutral-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Listings */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-emerald-600">
              Portfolio
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
              {agent.name.split(" ")[0]}&rsquo;s listings
            </h2>
          </div>
          <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-[12.5px] font-medium text-neutral-600">
            {listings.length} propert{listings.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {listings.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/60 py-16 text-center">
            <Building2 className="h-8 w-8 text-neutral-300" />
            <p className="mt-4 text-[15px] font-medium text-neutral-700">No live listings</p>
            <p className="mt-1 max-w-xs text-[13px] text-neutral-500">
              {agent.name.split(" ")[0]} is between portfolios right now — check back soon
              or browse the full collection.
            </p>
            <Button
              onClick={() => navigate({ name: "properties" })}
              className="mt-5 h-10 rounded-full bg-neutral-900 px-5 text-[13px] font-medium hover:bg-neutral-700"
            >
              Browse all properties
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Specialisations hint */}
      {listings.length > 0 && (
        <p className="mt-8 text-center text-[12.5px] text-neutral-400">
          Covering {stats?.districts ?? 1} neighbourhood
          {stats && stats.districts > 1 ? "s" : ""} ·{" "}
          {[...new Set(listings.map((l) => categoryLabel(l.type)))].join(", ")}
        </p>
      )}
    </div>
  );
}
