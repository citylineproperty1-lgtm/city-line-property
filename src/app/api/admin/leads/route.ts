import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";
import { parseActivities } from "@/lib/lead-activity";

export const dynamic = "force-dynamic";

/** CRM leads inbox. */
export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim() ?? "";
    const status = sp.get("status") ?? "";

    // Self-healing follow-up columns (no-ops after first call).

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
        { message: { contains: q } },
      ];
    }
    const STATUSES = ["NEW", "CONTACTED", "SITE_VISIT", "NEGOTIATION", "WON", "LOST"];
    if (STATUSES.includes(status)) where.status = status;

    const rows = await db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { property: { select: { id: true, title: true } } },
      take: 300,
    });

    // followUpAt / lastContactedAt are real Prisma columns now — no raw SQL
    // needed (raw was a legacy workaround for the self-healing column era).
    const toIso = (v: Date | string | number | null | undefined): string | null => {
      if (v == null) return null;
      const d = v instanceof Date ? v : new Date(v);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    };

    // Activity timelines (JSON column) — one query, merged by id.
    const actRows = await db.lead.findMany({
      where: { id: { in: rows.map((r) => r.id) } },
      select: { id: true, activities: true },
    });
    const activitiesById: Record<string, ReturnType<typeof parseActivities>> = {};
    for (const row of actRows) {
      activitiesById[row.id] = parseActivities(row.activities);
    }

    return NextResponse.json({
      leads: rows.map((r) => {
        return {
          id: r.id,
          name: r.name,
          phone: r.phone,
          email: r.email,
          category: r.category,
          area: r.area,
          budget: r.budget,
          message: r.message,
          propertyId: r.propertyId,
          property: r.property,
          source: r.source,
          status: r.status,
          notes: r.notes,
          waStatus: r.waStatus,
          waSentAt: r.waSentAt ? r.waSentAt.toISOString() : null,
          waError: r.waError,
          followUpAt: toIso(r.followUpAt),
          lastContactedAt: toIso(r.lastContactedAt),
          activities: activitiesById[r.id] ?? [],
          createdAt: r.createdAt.toISOString(),
        };
      }),
    });
  } catch (e) {
    console.error("GET /api/admin/leads", e);
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}
