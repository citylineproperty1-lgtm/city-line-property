import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public category list for filter chips + category tiles. */
export async function GET() {
  try {
    const rows = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({
      categories: rows.map((c) => ({
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        color: c.color,
        description: c.description,
      })),
    });
  } catch (e) {
    console.error("GET /api/categories", e);
    return NextResponse.json({ categories: [] }, { status: 200 });
  }
}
