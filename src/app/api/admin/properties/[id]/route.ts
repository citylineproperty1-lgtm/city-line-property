import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProperty } from "@/lib/serialize";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STATES = ["AVAILABLE", "RESERVED", "SOLD", "RENTED"];

/** Update any listing field — price / images / state / published … */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const existing = await db.property.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title.toString().trim();
    if (body.description !== undefined) data.description = body.description.toString();
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ error: "Price must be a positive number (PKR)." }, { status: 400 });
      }
      data.price = price;
    }
    if (body.status !== undefined) {
      const status = body.status.toString().toUpperCase();
      if (status !== "SALE" && status !== "RENT") {
        return NextResponse.json({ error: "Status must be SALE or RENT." }, { status: 400 });
      }
      data.status = status;
    }
    if (body.type !== undefined) data.type = body.type.toString().trim();
    if (body.beds !== undefined) data.beds = Math.max(0, Number(body.beds) | 0);
    if (body.baths !== undefined) data.baths = Math.max(0, Number(body.baths) | 0);
    if (body.area !== undefined) data.area = Math.max(0, Number(body.area) | 0);
    if (body.address !== undefined) data.address = body.address.toString();
    if (body.city !== undefined) data.city = body.city.toString();
    if (body.district !== undefined) data.district = body.district.toString();
    if (body.images !== undefined && Array.isArray(body.images)) {
      data.images = JSON.stringify(body.images.map(String).filter(Boolean));
    }
    if (body.amenities !== undefined && Array.isArray(body.amenities)) {
      data.amenities = JSON.stringify(body.amenities.map(String).filter(Boolean));
    }
    if (body.featured !== undefined) data.featured = Boolean(body.featured);
    if (body.published !== undefined) data.published = Boolean(body.published);
    if (body.listingState !== undefined) {
      const state = body.listingState.toString();
      if (!STATES.includes(state)) {
        return NextResponse.json({ error: "Invalid listing state." }, { status: 400 });
      }
      data.listingState = state;
    }
    if (body.yearBuilt !== undefined) data.yearBuilt = Number(body.yearBuilt) | 0;
    // Free text, e.g. "Available" (admin writes it manually)
    if (body.parking !== undefined) data.parking = String(body.parking).trim().slice(0, 80);

    const row = await db.property.update({ where: { id }, data });
    return NextResponse.json({ property: serializeProperty(row) });
  } catch (e) {
    console.error("PATCH /api/admin/properties/[id]", e);
    return NextResponse.json({ error: "Could not update listing." }, { status: 500 });
  }
}

/** Delete a listing. */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    await db.property.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/properties/[id]", e);
    return NextResponse.json({ error: "Could not delete listing." }, { status: 500 });
  }
}
