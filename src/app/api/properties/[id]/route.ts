import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProperty } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const row = await db.property.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { agent: true },
    });
    if (!row) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    // fire-and-forget view counter + traffic event (insights chart).
    // The ViewEvent insert uses raw SQL on purpose: the long-running dev
    // server can hold a Prisma client generated before the ViewEvent model
    // existed, and $executeRaw keeps working regardless of regenerations.
    db.property
      .update({ where: { id: row.id }, data: { views: { increment: 1 } } })
      .catch(() => {});
    db.$executeRaw`INSERT INTO ViewEvent (id, propertyId, createdAt) VALUES (${crypto.randomUUID()}, ${row.id}, ${Date.now()})`.catch(
      () => {}
    );
    return NextResponse.json({ property: serializeProperty(row) });
  } catch (e) {
    console.error("GET /api/properties/[id]", e);
    return NextResponse.json({ error: "Failed to load property" }, { status: 500 });
  }
}
