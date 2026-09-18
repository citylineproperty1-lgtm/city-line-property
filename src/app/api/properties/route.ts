import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProperty } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/** Public listing feed — only published inventory is exposed. */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const search = sp.get("search")?.trim() ?? "";
    const status = sp.get("status") ?? "";
    const type = sp.get("type") ?? "";
    const beds = Number(sp.get("beds") ?? 0);
    const minPrice = Number(sp.get("minPrice") ?? 0);
    const maxPrice = Number(sp.get("maxPrice") ?? 0);
    const city = sp.get("city") ?? "";
    const district = sp.get("district") ?? "";
    const featured = sp.get("featured") === "true";
    const sort = sp.get("sort") ?? "newest";
    const limit = Math.min(Number(sp.get("limit") ?? 60), 100);
    const offset = Math.max(Number(sp.get("offset") ?? 0), 0);
    const agentId = sp.get("agentId") ?? "";
    const ids = sp.get("ids");

    const where: Record<string, unknown> = { published: true };

    if (ids) {
      where.id = { in: ids.split(",").filter(Boolean) };
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { district: { contains: search } },
        { address: { contains: search } },
        { city: { contains: search } },
        { reference: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (status === "SALE" || status === "RENT") where.status = status;
    if (type && type !== "ALL") where.type = type; // NOTE: SQLite has no `mode: "insensitive"` — slugs are lowercase, plain equality is correct.
    if (city && city !== "ALL") where.city = city;
    if (district && district !== "ALL") where.district = district;
    if (!Number.isNaN(beds) && beds > 0) where.beds = { gte: beds };
    if (minPrice > 0 || maxPrice > 0) {
      where.price = {
        ...(minPrice > 0 ? { gte: minPrice } : {}),
        ...(maxPrice > 0 ? { lte: maxPrice } : {}),
      };
    }
    if (featured) where.featured = true;
    if (agentId) where.agentId = agentId;

    const orderBy: Record<string, "asc" | "desc"> =
      sort === "price-asc"
        ? { price: "asc" }
        : sort === "price-desc"
          ? { price: "desc" }
          : sort === "area-desc"
            ? { area: "desc" }
            : { createdAt: "desc" };

    const [rows, total] = await Promise.all([
      db.property.findMany({
        where,
        include: { agent: true },
        orderBy,
        take: limit,
        skip: offset,
      }),
      db.property.count({ where }),
    ]);

    return NextResponse.json({
      properties: rows.map(serializeProperty),
      total,
    });
  } catch (e) {
    console.error("GET /api/properties", e);
    return NextResponse.json({ error: "Failed to load properties" }, { status: 500 });
  }
}
