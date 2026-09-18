import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim();
    const phone = (body.phone ?? "").toString().trim() || null;
    const message = (body.message ?? "").toString().trim();
    const kind = (body.kind ?? "GENERAL").toString().trim();
    const propertyId = (body.propertyId ?? "").toString().trim() || null;

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!message || message.length < 5) {
      return NextResponse.json({ error: "Please write a short message (at least 5 characters)." }, { status: 400 });
    }

    if (propertyId) {
      const exists = await db.property.findUnique({ where: { id: propertyId } });
      if (!exists) {
        return NextResponse.json({ error: "Property not found." }, { status: 400 });
      }
    }

    const inquiry = await db.inquiry.create({
      data: { name, email, phone, message, kind, propertyId },
    });
    return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 });
  } catch (e) {
    console.error("POST /api/inquiries", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const count = await db.inquiry.count();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
