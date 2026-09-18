import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/** Category management (GET list / POST create). */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
    const counts = await db.property.groupBy({ by: ["type"], _count: { type: true } });
    const countMap = Object.fromEntries(counts.map((c) => [c.type, c._count.type]));
    return NextResponse.json({
      categories: categories.map((c) => ({ ...c, inUse: countMap[c.slug] ?? 0 })),
    });
  } catch (e) {
    console.error("GET /api/admin/categories", e);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const name = (body.name ?? "").toString().trim();
    if (!name || name.length < 3) {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }
    const slug = slugify((body.slug ?? name).toString());
    const exists = await db.category.findUnique({ where: { slug } });
    if (exists) {
      return NextResponse.json({ error: "A category with this slug already exists." }, { status: 409 });
    }
    const maxOrder = await db.category.aggregate({ _max: { sortOrder: true } });
    const row = await db.category.create({
      data: {
        name,
        slug,
        icon: (body.icon ?? "Building2").toString(),
        color: (body.color ?? "#0F766E").toString(),
        description: (body.description ?? "").toString(),
        sortOrder: Number(body.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1) | 0,
      },
    });
    return NextResponse.json({ category: row }, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/categories", e);
    return NextResponse.json({ error: "Could not create category." }, { status: 500 });
  }
}
