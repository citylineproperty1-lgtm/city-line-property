import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [properties, forSale, forRent, cities, districts, inquiries, agents] =
      await Promise.all([
        db.property.count(),
        db.property.count({ where: { status: "SALE" } }),
        db.property.count({ where: { status: "RENT" } }),
        db.property.groupBy({ by: ["city"] }),
        db.property.groupBy({ by: ["district"] }),
        db.inquiry.count(),
        db.agent.count(),
      ]);
    return NextResponse.json({
      stats: {
        properties,
        forSale,
        forRent,
        cities: cities.length,
        districts: districts.length,
        inquiries,
        agents,
      },
    });
  } catch (e) {
    console.error("GET /api/stats", e);
    return NextResponse.json({
      stats: { properties: 0, forSale: 0, forRent: 0, cities: 0, districts: 0, inquiries: 0, agents: 0 },
    });
  }
}
