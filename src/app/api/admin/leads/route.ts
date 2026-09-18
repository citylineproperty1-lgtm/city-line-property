import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** CRM leads inbox. */
export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim() ?? "";
    const status = sp.get("status") ?? "";

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

    return NextResponse.json({
      leads: rows.map((r) => ({
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
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("GET /api/admin/leads", e);
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}
