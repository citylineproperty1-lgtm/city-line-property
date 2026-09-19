import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";
import { ensureFollowUpColumns } from "@/lib/lead-followup";
import { appendLeadActivity } from "@/lib/lead-activity";

export const dynamic = "force-dynamic";

const STATUSES = ["NEW", "CONTACTED", "SITE_VISIT", "NEGOTIATION", "WON", "LOST"];
const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  SITE_VISIT: "Site Visit",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

/** Update lead status / notes / follow-up reminder — every change is logged to the activity timeline. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

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

    // ---- activity log (never blocks the main update) ----
    let activities: Awaited<ReturnType<typeof appendLeadActivity>> | undefined;
    const log = async (entry: { type: string; detail: string }) => {
      activities = await appendLeadActivity(id, entry);
    };
    if (body.status !== undefined && body.status.toString() !== existing.status) {
      await log({
        type: "status",
        detail: `${STATUS_LABELS[existing.status] ?? existing.status} → ${
          STATUS_LABELS[body.status.toString()] ?? body.status.toString()
        }`,
      });
    }
    if (body.notes !== undefined && (body.notes?.toString() ?? "") !== (existing.notes ?? "")) {
      await log({ type: "note", detail: "Notes updated" });
    }

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
      const oldMs = existing.followUpAt ? new Date(existing.followUpAt).getTime() : null;
      if (ms !== oldMs) {
        await log({
          type: "followup",
          detail:
            ms == null
              ? "Follow-up reminder cleared"
              : `Follow-up set for ${new Date(ms).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })} ${new Date(ms).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })}`,
        });
      }
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
      await log({ type: "contacted", detail: "Marked as contacted" });
    }

    return NextResponse.json({
      ok: true,
      status: row.status,
      notes: row.notes,
      ...(activities !== undefined ? { activities } : {}),
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
