import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Team management list (with listing counts). */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const agents = await db.agent.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { properties: true } } },
    });
    return NextResponse.json({
      agents: agents.map((a) => ({
        id: a.id,
        name: a.name,
        title: a.title,
        email: a.email,
        phone: a.phone,
        initials: a.initials,
        accent: a.accent,
        bio: a.bio,
        listings: a._count.properties,
      })),
    });
  } catch (e) {
    console.error("GET /api/admin/agents", e);
    return NextResponse.json({ error: "Failed to load team" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const name = (body.name ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    const exists = await db.agent.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "A team member with this email already exists." }, { status: 409 });
    }
    const initials =
      (body.initials ?? "").toString().trim().toUpperCase().slice(0, 2) ||
      name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase();

    const row = await db.agent.create({
      data: {
        name,
        title: (body.title ?? "Property Consultant").toString().trim(),
        email,
        phone: (body.phone ?? "").toString().trim(),
        initials,
        accent: (body.accent ?? "#C9A227").toString(),
        bio: (body.bio ?? "").toString(),
      },
    });
    return NextResponse.json({ agent: row }, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/agents", e);
    return NextResponse.json({ error: "Could not add team member." }, { status: 500 });
  }
}
