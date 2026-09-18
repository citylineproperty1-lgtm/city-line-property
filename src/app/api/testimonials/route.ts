import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.testimonial.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json({ testimonials: rows });
  } catch (e) {
    console.error("GET /api/testimonials", e);
    return NextResponse.json({ testimonials: [] });
  }
}
