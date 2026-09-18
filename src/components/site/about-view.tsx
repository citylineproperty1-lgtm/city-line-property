"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import type { Agent } from "@/lib/types";
import {
  ShieldCheck,
  HeartHandshake,
  Lightbulb,
  MessageSquare,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export function AboutView() {
  const { navigate } = useAppStore();
  const [agents, setAgents] = useState<(Agent & { listingCount?: number })[]>([]);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents ?? []))
      .catch(() => setAgents([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Hero */}
      <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
        <p className="text-[13px] font-semibold uppercase tracking-wider text-emerald-600">
          About City Line
        </p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
          We know every street.
          <br />
          <span className="text-neutral-400">Because we walk them.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-neutral-500">
          City Line Property began in 2011 as a two-person office above a bakery on
          Khayaban-e-Ittehad. Fourteen years later we&rsquo;re a team of specialists
          managing hundreds of crores in residential and commercial assets — still
          answering our own phones.
        </p>
      </motion.div>

      {/* Image */}
      <motion.div
        {...fadeUp}
        className="relative mt-12 aspect-[16/8] overflow-hidden rounded-3xl border border-neutral-200/70 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]"
      >
        <Image
          src="/images/about-team.jpg"
          alt="The City Line Property team at their Karachi office"
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
        />
      </motion.div>

      {/* Stats band */}
      <motion.div
        {...fadeUp}
        className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-200/60 sm:grid-cols-4"
      >
        {[
          { value: "14+", label: "Years in the market" },
          { value: "PKR 9B+", label: "Property sold" },
          { value: "1,200+", label: "Families housed" },
          { value: "97%", label: "Clients who refer us" },
        ].map((s) => (
          <div key={s.label} className="bg-white px-6 py-8 text-center">
            <p className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              {s.value}
            </p>
            <p className="mt-1.5 text-[13px] font-medium text-neutral-400">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Values */}
      <section className="pt-20">
        <motion.div {...fadeUp} className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            What we stand for
          </h2>
        </motion.div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: ShieldCheck,
              title: "Integrity first",
              text: "No fake listings, no hidden commissions, no pressure. Our contracts are plain-language and every fee is on the table from day one.",
            },
            {
              icon: HeartHandshake,
              title: "Relationships over transactions",
              text: "Most of our business comes from clients who have moved with us two, three, even four times. We play the long game.",
            },
            {
              icon: Lightbulb,
              title: "Data-driven advice",
              text: "We track actual transaction prices across the city, so our valuations reflect what buyers really pay — not what sellers hope.",
            },
            {
              icon: MessageSquare,
              title: "Radical responsiveness",
              text: "Calls returned within the hour, offers presented same-day, and honest answers even when they cost us a deal.",
            },
          ].map((v, i) => (
            <motion.div
              key={v.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.06 }}
              className="rounded-2xl border border-neutral-200/80 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <v.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-neutral-900">
                {v.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-500">{v.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="pt-20">
        <motion.div
          {...fadeUp}
          className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Meet the team
            </h2>
            <p className="mt-2 max-w-md text-sm text-neutral-500">
              Small, senior and specialist — every agent leads their own portfolio.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate({ name: "contact" })}
            className="group h-10 rounded-full text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            Work with us
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {agents.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-2xl bg-neutral-100" />
              ))
            : agents.map((a, i) => (
                <motion.div
                  key={a.id}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                  className="group rounded-2xl border border-neutral-200/80 bg-white p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white"
                    style={{ backgroundColor: a.accent }}
                  >
                    {a.initials}
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-neutral-900">
                    {a.name}
                  </h3>
                  <p className="text-[13px] text-emerald-700">{a.title}</p>
                  <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-neutral-500">
                    {a.bio}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 border-t border-neutral-100 pt-4">
                    {a.listingCount !== undefined && (
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11.5px] font-medium text-neutral-600">
                        {a.listingCount} active listing{a.listingCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-3 text-[12.5px] text-neutral-400">
                    <a
                      href={`mailto:${a.email}`}
                      className="flex items-center gap-1 transition-colors hover:text-neutral-700"
                      aria-label={`Email ${a.name}`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={`tel:${a.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-1 transition-colors hover:text-neutral-700"
                      aria-label={`Call ${a.name}`}
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </motion.div>
              ))}
        </div>
      </section>

      {/* Story */}
      <section className="pt-20">
        <motion.div
          {...fadeUp}
          className="grid gap-10 rounded-3xl bg-neutral-50/80 p-8 sm:p-12 lg:grid-cols-2"
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Our story
            </h2>
            <div className="mt-5 space-y-4 text-[14.5px] leading-relaxed text-neutral-600">
              <p>
                In 2011, after a decade at large brokerages, our founders were tired of
                watching families overpay for homes photographed through car windows.
                They started City Line with a simple rule: never list anything we
                wouldn&rsquo;t recommend to our own family.
              </p>
              <p>
                That rule shaped everything — our in-house inspection checklist, our
                verified-ownership process, and our policy of publishing real
                transaction data so clients can negotiate from strength.
              </p>
              <p>
                Today we operate across DHA, Clifton, PECHS, Bahria Town and the wider
                city — residential, commercial and land — but every listing still gets
                walked, photographed and price-checked by a senior agent before you
                ever see it.
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            {[
              { year: "2011", text: "Founded above a bakery in DHA Phase 6 — first month: 2 rentals." },
              { year: "2015", text: "Opened our commercial desk on I.I. Chundrigar Road." },
              { year: "2019", text: "Launched verified listings — in-house inspections before going live." },
              { year: "2024", text: "Crossed PKR 9 billion in lifetime sales across 1,200 families." },
            ].map((m) => (
              <div key={m.year} className="flex gap-4 rounded-2xl border border-neutral-200/70 bg-white p-4">
                <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-[13px] font-semibold text-white">
                  {m.year}
                </span>
                <p className="self-center text-[13.5px] leading-relaxed text-neutral-600">
                  {m.text}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
