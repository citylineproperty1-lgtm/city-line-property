import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Update a category (name / icon / color / order / description). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.toString().trim();
    if (body.icon !== undefined) data.icon = body.icon.toString();
    if (body.color !== undefined) data.color = body.color.toString();
    if (body.description !== undefined) data.description = body.description.toString();
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) | 0;

    const row = await db.category.update({ where: { id }, data });
    return NextResponse.json({ category: row });
  } catch (e) {
    console.error("PATCH /api/admin/categories/[id]", e);
    return NextResponse.json({ error: "Could not update category." }, { status: 500 });
  }
}

/** Delete a category — blocked while listings still use it. */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const cat = await db.category.findUnique({ where: { id } });
    if (!cat) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    const inUse = await db.property.count({ where: { type: cat.slug } });
    if (inUse > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${inUse} listing(s) still use this category.` },
        { status: 409 }
      );
    }
    await db.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/categories/[id]", e);
    return NextResponse.json({ error: "Could not delete category." }, { status: 500 });
  }
}
