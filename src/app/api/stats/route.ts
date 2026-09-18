import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [properties, forSale, forRent, cities, districts, leads] =
      await Promise.all([
        db.property.count({ where: { published: true } }),
        db.property.count({ where: { status: "SALE", published: true } }),
        db.property.count({ where: { status: "RENT", published: true } }),
        db.property.groupBy({ by: ["city"], where: { published: true } }),
        db.property.groupBy({ by: ["district"], where: { published: true } }),
        db.lead.count(),
      ]);
    return NextResponse.json({
      stats: {
        properties,
        forSale,
        forRent,
        cities: cities.length,
        districts: districts.length,
        leads,
      },
    });
  } catch (e) {
    console.error("GET /api/stats", e);
    return NextResponse.json({
      stats: { properties: 0, forSale: 0, forRent: 0, cities: 0, districts: 0, leads: 0 },
    });
  }
}
