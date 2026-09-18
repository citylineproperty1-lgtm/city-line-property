import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Dashboard KPIs for the admin overview tab. */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
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
      subscribers,
      agents,
      categoryRows,
      areaRows,
      recentLeadRows,
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
      db.newsletter.count(),
      db.agent.count(),
      db.property.groupBy({ by: ["type"], _count: { type: true } }),
      db.property.groupBy({ by: ["district"], _count: { district: true } }),
      db.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { property: { select: { title: true } } },
      }),
    ]);

    const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
    const byCategory = categoryRows
      .map((row) => {
        const cat = categories.find((c) => c.slug === row.type);
        return {
          slug: row.type,
          name: cat?.name ?? row.type,
          color: cat?.color ?? "#C9A227",
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

    return NextResponse.json({
      overview: {
        properties: { total: totalProperties, published, available, reserved, sold, rented, featured },
        leads: { total: totalLeads, new: newLeads, contacted, siteVisits, negotiation, won, lost },
        whatsapp: { sent: waSent, failed: waFailed },
        subscribers,
        agents,
        byCategory,
        byArea,
        recentLeads,
      },
    });
  } catch (e) {
    console.error("GET /api/admin/overview", e);
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 });
  }
}
