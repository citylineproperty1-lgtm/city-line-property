import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Update a team member profile. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.toString().trim();
    if (body.title !== undefined) data.title = body.title.toString().trim();
    if (body.phone !== undefined) data.phone = body.phone.toString().trim();
    if (body.initials !== undefined) {
      data.initials = body.initials.toString().trim().toUpperCase().slice(0, 2) || "CL";
    }
    if (body.accent !== undefined) data.accent = body.accent.toString();
    if (body.bio !== undefined) data.bio = body.bio.toString();
    if (body.email !== undefined) {
      const email = body.email.toString().trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Invalid email." }, { status: 400 });
      }
      const clash = await db.agent.findFirst({ where: { email, id: { not: id } } });
      if (clash) {
        return NextResponse.json({ error: "Email already used by another member." }, { status: 409 });
      }
      data.email = email;
    }

    const row = await db.agent.update({ where: { id }, data });
    return NextResponse.json({ agent: row });
  } catch (e) {
    console.error("PATCH /api/admin/agents/[id]", e);
    return NextResponse.json({ error: "Could not update team member." }, { status: 500 });
  }
}

/** Delete a team member — blocked while listings are assigned to them. */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const listings = await db.property.count({ where: { agentId: id } });
    if (listings > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${listings} listing(s) assigned. Reassign them first.` },
        { status: 409 }
      );
    }
    await db.agent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/agents/[id]", e);
    return NextResponse.json({ error: "Could not delete team member." }, { status: 500 });
  }
}
