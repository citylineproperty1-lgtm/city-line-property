import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    await db.newsletter.upsert({
      where: { email },
      update: {},
      create: { email },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("POST /api/newsletter", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rows = await db.newsletter.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      count: rows.length,
      subscribers: rows.map((r) => ({
        id: r.id,
        email: r.email,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("GET /api/newsletter", e);
    return NextResponse.json({ count: 0, subscribers: [] });
  }
}
