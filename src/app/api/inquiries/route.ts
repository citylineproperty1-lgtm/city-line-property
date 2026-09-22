import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dispatchLeadWebhook } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * Back-compat wrapper: the contact + property-viewing forms still POST here.
 * Payloads are stored as CRM Leads (kind VIEWING/GENERAL → source) so the
 * admin inbox shows everything in one pipeline.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim() || null;
    const phone = (body.phone ?? "").toString().trim() || "Not provided";
    const message = (body.message ?? "").toString().trim();
    const kind = (body.kind ?? "GENERAL").toString().trim().toUpperCase();
    const propertyId = (body.propertyId ?? "").toString().trim() || null;

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!message || message.length < 5) {
      return NextResponse.json(
        { error: "Please write a short message (at least 5 characters)." },
        { status: 400 }
      );
    }

    if (propertyId) {
      const exists = await db.property.findUnique({ where: { id: propertyId } });
      if (!exists) {
        return NextResponse.json({ error: "Property not found." }, { status: 400 });
      }
    }

    const lead = await db.lead.create({
      data: {
        name,
        email,
        phone,
        message,
        propertyId,
        source: kind === "VIEWING" ? "PROPERTY" : "CONTACT",
      },
    });

    // Fire webhook, ignore failures (legacy form doesn't use waLink).
    try {
      await dispatchLeadWebhook(lead.id);
    } catch {
      /* noop */
    }

    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (e) {
    console.error("POST /api/inquiries", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
