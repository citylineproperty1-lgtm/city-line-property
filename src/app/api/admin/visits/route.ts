import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const VISIT_STATUSES = ["PLANNED", "DONE", "NO_SHOW", "CANCELLED"] as const;

/** CRM site-visit scheduler. Lists visits grouped client-side by date. */
export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") ?? "";

    const where: Record<string, unknown> = {};
    if ((VISIT_STATUSES as readonly string[]).includes(status)) where.status = status;

    const rows = await db.siteVisit.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      include: { property: { select: { id: true, title: true } } },
      take: 300,
    });

    const now = Date.now();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return NextResponse.json({
      visits: rows.map((v) => ({
        id: v.id,
        name: v.name,
        phone: v.phone,
        propertyId: v.propertyId,
        property: v.property,
        area: v.area,
        scheduledAt: v.scheduledAt.toISOString(),
        status: v.status,
        notes: v.notes,
        createdAt: v.createdAt.toISOString(),
      })),
      counts: {
        planned: rows.filter((v) => v.status === "PLANNED").length,
        today: rows.filter(
          (v) =>
            v.status === "PLANNED" &&
            v.scheduledAt.getTime() >= now &&
            v.scheduledAt.getTime() <= endOfToday.getTime()
        ).length,
      },
    });
  } catch (e) {
    console.error("GET /api/admin/visits", e);
    return NextResponse.json({ error: "Failed to load visits" }, { status: 500 });
  }
}

/** Book a site visit. */
export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const name = body.name?.toString().trim() ?? "";
    const phone = body.phone?.toString().trim() ?? "";
    const scheduledAt = new Date(body.scheduledAt ?? "");

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required." }, { status: 400 });
    }
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "A valid date & time is required." }, { status: 400 });
    }

    const visit = await db.siteVisit.create({
      data: {
        name,
        phone,
        propertyId: body.propertyId ? body.propertyId.toString() : null,
        area: body.area ? body.area.toString() : null,
        scheduledAt,
        notes: body.notes ? body.notes.toString() : null,
      },
      include: { property: { select: { id: true, title: true } } },
    });

    return NextResponse.json({
      ok: true,
      visit: {
        ...visit,
        scheduledAt: visit.scheduledAt.toISOString(),
        createdAt: visit.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("POST /api/admin/visits", e);
    return NextResponse.json({ error: "Could not book the visit." }, { status: 500 });
  }
}
