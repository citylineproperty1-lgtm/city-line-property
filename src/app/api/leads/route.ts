import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dispatchLeadWebhook, buildLeadMessage } from "@/lib/whatsapp";
import { waLink } from "@/lib/business";

export const dynamic = "force-dynamic";

/**
 * Public lead capture (requirement form / contact).
 * Every lead is stored in the CRM database and pushed to the configured
 * WhatsApp webhook. The response includes a wa.me deep link so the visitor
 * can also send the exact same brief straight to our WhatsApp chat.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name ?? "").toString().trim();
    const phone = (body.phone ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim() || null;
    const category = (body.category ?? "").toString().trim() || null;
    const area = (body.area ?? "").toString().trim() || null;
    const budget = Number(body.budget ?? 0);
    const message = (body.message ?? "").toString().trim();
    const propertyId = (body.propertyId ?? "").toString().trim() || null;
    const source = (body.source ?? "WEBSITE").toString().trim().toUpperCase();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!/^(\+?\d[\d\s-]{7,15})$/.test(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number (e.g. 0300 1234567)." },
        { status: 400 }
      );
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
        phone,
        email,
        category,
        area,
        budget: Number.isFinite(budget) && budget > 0 ? budget : null,
        message,
        propertyId,
        source: ["WEBSITE", "CONTACT", "PROPERTY", "REQUIREMENT", "WHATSAPP", "PRICE_LIST", "DETAIL_UNLOCK"].includes(source)
          ? source
          : "WEBSITE",
        waStatus: "PENDING",
      },
      include: { property: { select: { id: true, title: true } } },
    });

    // Push to the configured webhook (CallMeBot / Make.com / n8n …) — failure is non-blocking.
    let waStatus: string = "SKIPPED";
    try {
      waStatus = await dispatchLeadWebhook(lead.id);
    } catch (err) {
      console.error("webhook dispatch failed", err);
    }

    const waMessage = buildLeadMessage({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      category: lead.category,
      area: lead.area,
      budget: lead.budget,
      message: lead.message,
      source,
      property: lead.property,
    });
    return NextResponse.json(
      {
        ok: true,
        id: lead.id,
        waStatus,
        waLink: waLink(waMessage),
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/leads", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

/** Leads are private CRM data — reading requires the admin API. */
export async function GET() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
