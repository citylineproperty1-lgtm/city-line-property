import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";
import { ensureFollowUpColumns } from "@/lib/lead-followup";

export const dynamic = "force-dynamic";

const STATUSES = ["NEW", "CONTACTED", "SITE_VISIT", "NEGOTIATION", "WON", "LOST"];

/** Update lead status / notes / follow-up reminder. */
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

    // Follow-up fields live outside the Prisma client — raw SQL.
    let followUpAt: string | null | undefined;
    let lastContactedAt: string | null | undefined;
    if (body.followUpAt !== undefined) {
      await ensureFollowUpColumns();
      const ms = body.followUpAt === null ? null : new Date(body.followUpAt).getTime();
      if (body.followUpAt !== null && (ms == null || Number.isNaN(ms))) {
        return NextResponse.json({ error: "Invalid followUpAt." }, { status: 400 });
      }
      await db.$executeRawUnsafe(`UPDATE "Lead" SET "followUpAt" = ? WHERE "id" = ?`, ms, id);
      followUpAt = ms == null ? null : new Date(ms).toISOString();
    }
    if (body.lastContactedAt !== undefined) {
      await ensureFollowUpColumns();
      const ms = body.lastContactedAt === null ? null : new Date(body.lastContactedAt).getTime();
      await db.$executeRawUnsafe(
        `UPDATE "Lead" SET "lastContactedAt" = ? WHERE "id" = ?`,
        ms ?? Date.now(),
        id
      );
      lastContactedAt = new Date(ms ?? Date.now()).toISOString();
    }

    return NextResponse.json({
      ok: true,
      status: row.status,
      notes: row.notes,
      ...(followUpAt !== undefined ? { followUpAt } : {}),
      ...(lastContactedAt !== undefined ? { lastContactedAt } : {}),
    });
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
