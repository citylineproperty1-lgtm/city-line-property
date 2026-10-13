import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeAgent } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.agent.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { properties: true } } },
    });
    return NextResponse.json({
      agents: rows.map((r) => ({
        ...serializeAgent(r),
        listingCount: r._count.properties,
      })),
    });
  } catch (e) {
    console.error("GET /api/agents", e);
    return NextResponse.json({ error: "Failed to load agents" }, { status: 500 });
  }
}
