import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeAgent } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await db.agent.findUnique({
      where: { id },
      include: { _count: { select: { properties: true } } },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    return NextResponse.json({
      agent: {
        ...serializeAgent(agent),
        listingCount: agent._count.properties,
      },
    });
  } catch (e) {
    console.error("GET /api/agents/[id]", e);
    return NextResponse.json({ error: "Failed to load agent" }, { status: 500 });
  }
}
