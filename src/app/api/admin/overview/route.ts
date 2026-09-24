import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";
import { followUpQueue } from "@/lib/lead-followup";

export const dynamic = "force-dynamic";

/** Dashboard KPIs for the admin overview tab. */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);
    const [
      totalProperties,
      published,
      available,
      reserved,
      sold,
      rented,
      featured,
      totalLeads,
      newLeads,
      contacted,
      siteVisits,
      negotiation,
      won,
      lost,
      waSent,
      waFailed,
      categoryRows,
      areaRows,
      recentLeadRows,
      leadRows14,
    ] = await Promise.all([
      db.property.count(),
      db.property.count({ where: { published: true } }),
      db.property.count({ where: { listingState: "AVAILABLE" } }),
      db.property.count({ where: { listingState: "RESERVED" } }),
      db.property.count({ where: { listingState: "SOLD" } }),
      db.property.count({ where: { listingState: "RENTED" } }),
      db.property.count({ where: { featured: true } }),
      db.lead.count(),
      db.lead.count({ where: { status: "NEW" } }),
      db.lead.count({ where: { status: "CONTACTED" } }),
      db.lead.count({ where: { status: "SITE_VISIT" } }),
      db.lead.count({ where: { status: "NEGOTIATION" } }),
      db.lead.count({ where: { status: "WON" } }),
      db.lead.count({ where: { status: "LOST" } }),
      db.lead.count({ where: { waStatus: "SENT" } }),
      db.lead.count({ where: { waStatus: "FAILED" } }),
      db.property.groupBy({ by: ["type"], _count: { type: true } }),
      db.property.groupBy({ by: ["district"], _count: { district: true } }),
      db.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { property: { select: { title: true } } },
      }),
      // 14-day lead trend — portable Prisma query (raw SQL broke on
      // Postgres: unquoted `Lead` folds to lowercase and 42P01s).
      db.lead.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
    const byCategory = categoryRows
      .map((row) => {
        const cat = categories.find((c) => c.slug === row.type);
        return {
          slug: row.type,
          name: cat?.name ?? row.type,
          color: cat?.color ?? "#0F766E",
          count: row._count.type,
        };
      })
      .sort((a, b) => b.count - a.count);

    const byArea = areaRows
      .map((row) => ({ area: row.district, count: row._count.district }))
      .sort((a, b) => b.count - a.count);

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

    const dayKeys = dayBucketKeys(14);
    const bucket = (rows: { createdAt: string | Date }[]) => {
      const counts = dayKeys.map(() => 0);
      for (const row of rows) {
        const idx = dayKeys.findIndex((k) => k.key === new Date(row.createdAt).toDateString());
        if (idx >= 0) counts[idx]++;
      }
      return dayKeys.map((k, i) => ({ label: k.label, count: counts[i] }));
    };
    const leadTrend = bucket(leadRows14);

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
