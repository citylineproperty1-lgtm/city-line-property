import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STATUSES = ["NEW", "CONTACTED", "SITE_VISIT", "NEGOTIATION", "WON", "LOST"];

/** Update lead status / notes. */
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
    if (body.notes !== undefined) data.notes = body.notes?.toString() ?? null;

    const row = await db.lead.update({ where: { id }, data });
    return NextResponse.json({ ok: true, status: row.status, notes: row.notes });
  } catch (e) {
    console.error("PATCH /api/admin/leads/[id]", e);
    return NextResponse.json({ error: "Could not update lead." }, { status: 500 });
  }
}

/** Delete a lead. */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    await db.lead.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/leads/[id]", e);
    return NextResponse.json({ error: "Could not delete lead." }, { status: 500 });
  }
}
