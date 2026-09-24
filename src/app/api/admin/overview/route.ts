import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";
import { followUpQueue } from "@/lib/lead-followup";

export const dynamic = "force-dynamic";

/**
 * Dashboard KPIs for the admin overview tab.
 *
 * Serverless-safe by design: earlier this route fired ~20 parallel Prisma
 * queries via Promise.all, which exceeded the pgbouncer connection pool
 * (connection_limit=1) within the 10s pool timeout on cold Vercel
 * functions → 500 "Failed to load overview". We now fetch exactly four
 * small tables in parallel and aggregate everything in JS (an agency
 * dataset is tiny — counts stay correct and instant).
 */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const [propertyRows, leadRows, categories, recentLeadRows] = await Promise.all([
      db.property.findMany({
        select: {
          listingState: true,
          published: true,
          featured: true,
          type: true,
          district: true,
        },
      }),
      db.lead.findMany({
        select: { status: true, waStatus: true, createdAt: true },
      }),
      db.category.findMany({ orderBy: { sortOrder: "asc" } }),
      db.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { property: { select: { title: true } } },
      }),
    ]);

    // ---- Properties (aggregated in JS) ----
    const countBy = <T extends string>(rows: Record<string, unknown>[], key: string) => {
      const m = new Map<T, number>();
      for (const r of rows) {
        const v = r[key] as T | null;
        if (v != null) m.set(v, (m.get(v) ?? 0) + 1);
      }
      return m;
    };

    const propState = countBy(propertyRows, "listingState");
    const totalProperties = propertyRows.length;
    const published = propertyRows.filter((p) => p.published).length;
    const featured = propertyRows.filter((p) => p.featured).length;
    const available = propState.get("AVAILABLE") ?? 0;
    const reserved = propState.get("RESERVED") ?? 0;
    const sold = propState.get("SOLD") ?? 0;
    const rented = propState.get("RENTED") ?? 0;

    const byCategory = Array.from(countBy(propertyRows, "type").entries())
      .map(([slug, count]) => {
        const cat = categories.find((c) => c.slug === slug);
        return { slug, name: cat?.name ?? slug, color: cat?.color ?? "#0F766E", count };
      })
      .sort((a, b) => b.count - a.count);

    const byArea = Array.from(countBy(propertyRows, "district").entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count);

    // ---- Leads (aggregated in JS) ----
    const leadStatus = countBy(leadRows, "status");
    const leadWa = countBy(leadRows, "waStatus");
    const totalLeads = leadRows.length;
    const newLeads = leadStatus.get("NEW") ?? 0;
    const contacted = leadStatus.get("CONTACTED") ?? 0;
    const siteVisits = leadStatus.get("SITE_VISIT") ?? 0;
    const negotiation = leadStatus.get("NEGOTIATION") ?? 0;
    const won = leadStatus.get("WON") ?? 0;
    const lost = leadStatus.get("LOST") ?? 0;
    const waSent = leadWa.get("SENT") ?? 0;
    const waFailed = leadWa.get("FAILED") ?? 0;

    const recentLeads = recentLeadRows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      message: r.message.slice(0, 120),
      status: r.status,
      waStatus: r.waStatus,
      source: r.source,
      property: r.property?.title ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

    // 14-day lead trend (from the same leadRows — no extra query)
    const dayKeys = dayBucketKeys(14);
    const counts = dayKeys.map(() => 0);
    for (const row of leadRows) {
      const ts = row.createdAt instanceof Date ? row.createdAt.getTime() : Date.parse(row.createdAt);
      if (Number.isFinite(ts) && ts >= since.getTime()) {
        const idx = dayKeys.findIndex((k) => k.key === new Date(ts).toDateString());
        if (idx >= 0) counts[idx]++;
      }
    }
    const leadTrend = dayKeys.map((k, i) => ({ label: k.label, count: counts[i] }));

    const followUps = await followUpQueue(4);

    return NextResponse.json({
      overview: {
        properties: { total: totalProperties, published, available, reserved, sold, rented, featured },
        leads: { total: totalLeads, new: newLeads, contacted, siteVisits, negotiation, won, lost },
        whatsapp: { sent: waSent, failed: waFailed },
        byCategory,
        byArea,
        recentLeads,
        leadTrend,
        followUps,
      },
    });
  } catch (e) {
    console.error("GET /api/admin/overview", e);
    // Route handler errors are logged; the message is surfaced only to the
    // authenticated admin client (this endpoint 401s everyone else).
    const detail = e instanceof Error ? e.message.slice(0, 300) : "Unknown error";
    return NextResponse.json({ error: "Failed to load overview", detail }, { status: 500 });
  }
}

/** 14 local-day buckets ending today, e.g. "Sep 5" (mirrors /api/insights). */
function dayBucketKeys(n: number): { key: string; label: string }[] {
  const keys: { key: string; label: string }[] = [];
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push({ key: d.toDateString(), label: fmt.format(d) });
  }
  return keys;
}
