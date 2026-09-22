import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["NEW", "CONTACTED", "CLOSED"];

/**
 * Legacy inquiry status update — inquiries are stored as CRM Leads
 * (source CONTACT | PROPERTY), so the PATCH is mapped onto the Lead row.
 * "CLOSED" maps to the CRM pipeline's WON state.
 */
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

    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing || (existing.source !== "CONTACT" && existing.source !== "PROPERTY")) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }

    await db.lead.update({
      where: { id },
      data: { status: status === "CLOSED" ? "WON" : status },
    });

    return NextResponse.json({ ok: true, inquiry: { id, status } });
  } catch (e) {
    console.error("PATCH /api/inquiries/[id]", e);
    return NextResponse.json({ error: "Failed to update inquiry." }, { status: 500 });
  }
}
