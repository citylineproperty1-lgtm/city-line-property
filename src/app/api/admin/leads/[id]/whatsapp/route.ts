import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";
import { dispatchLeadWebhook } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/** Manually (re-)send a lead through the WhatsApp webhook. */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const exists = await db.lead.findUnique({ where: { id } });
    if (!exists) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    const result = await dispatchLeadWebhook(id);
    return NextResponse.json({ ok: result === "SENT", waStatus: result });
  } catch (e) {
    console.error("POST /api/admin/leads/[id]/whatsapp", e);
    return NextResponse.json({ error: "Could not dispatch webhook." }, { status: 500 });
  }
}
