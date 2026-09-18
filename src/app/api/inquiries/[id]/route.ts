import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["NEW", "CONTACTED", "CLOSED"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const status = (body.status ?? "").toString().trim().toUpperCase();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Status must be one of NEW, CONTACTED, CLOSED." },
        { status: 400 }
      );
    }

    const existing = await db.inquiry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }

    const updated = await db.inquiry.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ ok: true, inquiry: { id: updated.id, status: updated.status } });
  } catch (e) {
    console.error("PATCH /api/inquiries/[id]", e);
    return NextResponse.json({ error: "Failed to update inquiry." }, { status: 500 });
  }
}
