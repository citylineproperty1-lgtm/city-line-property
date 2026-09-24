import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProperty } from "@/lib/serialize";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const STATES = ["AVAILABLE", "RESERVED", "SOLD", "RENTED"];

/** Inventory list for the admin panel (includes drafts + sold). */
export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim() ?? "";
    const state = sp.get("state") ?? "";
    const category = sp.get("category") ?? "";

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { reference: { contains: q } },
        { district: { contains: q } },
        { address: { contains: q } },
      ];
    }
    if (STATES.includes(state)) where.listingState = state;
    if (category && category !== "ALL") where.type = category;

    const rows = await db.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ properties: rows.map(serializeProperty) });
  } catch (e) {
    console.error("GET /api/admin/properties", e);
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}

/** Create a listing (the "add post" flow). */
export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const title = (body.title ?? "").toString().trim();
    const price = Number(body.price ?? 0);
    const status = (body.status ?? "SALE").toString().toUpperCase();
    const type = (body.type ?? "").toString().trim();
    const district = (body.district ?? "").toString().trim();

    if (!title || title.length < 5) {
      return NextResponse.json({ error: "Title is required (min 5 chars)." }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Price must be a positive number (PKR)." }, { status: 400 });
    }
    if (status !== "SALE" && status !== "RENT") {
      return NextResponse.json({ error: "Status must be SALE or RENT." }, { status: 400 });
    }
    if (!type) return NextResponse.json({ error: "Category is required." }, { status: 400 });
    if (!district) return NextResponse.json({ error: "Area is required." }, { status: 400 });

    const count = await db.property.count();
    const reference = `CLP-${101 + count}`;
    const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;

    const images = Array.isArray(body.images) ? body.images.map(String).filter(Boolean) : [];
    const amenities = Array.isArray(body.amenities) ? body.amenities.map(String).filter(Boolean) : [];

    const row = await db.property.create({
      data: {
        title,
        slug,
        reference,
        description: (body.description ?? "").toString(),
        price,
        status,
        type,
        beds: Math.max(0, Number(body.beds ?? 0) | 0),
        baths: Math.max(0, Number(body.baths ?? 0) | 0),
        area: Math.max(0, Number(body.area ?? 0) | 0),
        address: (body.address ?? "").toString(),
        city: (body.city ?? "Lahore").toString(),
        district,
        images: JSON.stringify(images),
        amenities: JSON.stringify(amenities),
        featured: Boolean(body.featured),
        published: body.published === undefined ? true : Boolean(body.published),
        listingState: STATES.includes((body.listingState ?? "").toString())
          ? (body.listingState as string).toString()
          : "AVAILABLE",
        yearBuilt: Number(body.yearBuilt ?? 2024) | 0,
        // Free text, e.g. "Available" (admin writes it manually)
        parking: String(body.parking ?? "").trim().slice(0, 80),
      },
    });
    return NextResponse.json({ property: serializeProperty(row) }, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/properties", e);
    return NextResponse.json({ error: "Could not create listing." }, { status: 500 });
  }
}
