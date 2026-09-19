import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STATUSES = ["PLANNED", "DONE", "NO_SHOW", "CANCELLED"];

/** Update a site visit — status, reschedule, notes. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.status !== undefined) {
      const status = body.status.toString();
      if (!STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      data.status = status;
    }
    if (body.scheduledAt !== undefined) {
      const d = new Date(body.scheduledAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid date." }, { status: 400 });
      }
      data.scheduledAt = d;
    }
    if (body.notes !== undefined) data.notes = body.notes?.toString() ?? null;
    if (body.area !== undefined) data.area = body.area?.toString() ?? null;

    const visit = await db.siteVisit.update({
      where: { id },
      data,
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
    console.error("PATCH /api/admin/visits/[id]", e);
    return NextResponse.json({ error: "Could not update the visit." }, { status: 500 });
  }
}

/** Delete a site visit. */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    await db.siteVisit.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/visits/[id]", e);
    return NextResponse.json({ error: "Could not delete the visit." }, { status: 500 });
  }
}
