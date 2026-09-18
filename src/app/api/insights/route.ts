import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Property as DbProperty } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows: DbProperty[] = await db.property.findMany();
    const total = rows.length;
    const sales = rows.filter((r) => r.status === "SALE");
    const rents = rows.filter((r) => r.status === "RENT");

    const avg = (nums: number[]) =>
      nums.length === 0 ? 0 : Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);

    const avgSalePrice = avg(sales.map((r) => r.price));
    const avgRent = avg(rents.map((r) => r.price));
    const avgPricePerSqft =
      sales.length === 0
        ? 0
        : Math.round(
            sales.reduce((sum, r) => sum + (r.area > 0 ? r.price / r.area : 0), 0) / sales.length
          );
    const avgArea = avg(rows.map((r) => r.area));
    const avgRating =
      rows.length === 0
        ? 0
        : Math.round((rows.reduce((sum, r) => sum + r.rating, 0) / rows.length) * 10) / 10;

    // District aggregates
    const districtMap = new Map<string, { sale: number[]; rent: number[] }>();
    for (const r of rows) {
      const entry = districtMap.get(r.district) ?? { sale: [], rent: [] };
      if (r.status === "SALE") entry.sale.push(r.price);
      else entry.rent.push(r.price);
      districtMap.set(r.district, entry);
    }
    const byDistrict = [...districtMap.entries()]
      .map(([district, v]) => ({
        district,
        count: v.sale.length + v.rent.length,
        saleAvg: avg(v.sale),
        rentAvg: avg(v.rent),
      }))
      .sort((a, b) => b.count - a.count);

    // Type mix
    const typeMap = new Map<string, number>();
    for (const r of rows) typeMap.set(r.type, (typeMap.get(r.type) ?? 0) + 1);
    const typeMix = [...typeMap.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Most viewed
    const mostViewed = [...rows]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        title: r.title,
        district: r.district,
        price: r.price,
        status: r.status,
        views: r.views,
        beds: r.beds,
        baths: r.baths,
        image: JSON.parse(r.images)[0] ?? "",
      }));

    // Traffic — view events bucketed per day over the last 14 days.
    // Raw SQL: survives dev-server processes holding a pre-ViewEvent
    // generated Prisma client (model accessors can be stale after regen).
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);
    const eventRows = await db.$queryRaw<{ createdAt: string | Date }[]>`
      SELECT "createdAt" FROM ViewEvent WHERE "createdAt" >= ${since.getTime()}
    `;
    const dayKeys = dayBucketKeys(14);
    const counts = dayKeys.map(() => 0);
    for (const ev of eventRows) {
      const key = new Date(ev.createdAt).toDateString();
      const idx = dayKeys.findIndex((k) => k.key === key);
      if (idx >= 0) counts[idx]++;
    }
    const viewsByDay = dayKeys.map((k, i) => ({ label: k.label, count: counts[i] }));
    const viewsLast7 = counts.slice(7).reduce((a, b) => a + b, 0);
    const viewsPrev7 = counts.slice(0, 7).reduce((a, b) => a + b, 0);
    const weekDelta =
      viewsPrev7 === 0
        ? viewsLast7 > 0
          ? 100
          : 0
        : Math.round(((viewsLast7 - viewsPrev7) / viewsPrev7) * 100);

    return NextResponse.json({
      insights: {
        total,
        saleCount: sales.length,
        rentCount: rents.length,
        avgSalePrice,
        avgRent,
        avgPricePerSqft,
        avgArea,
        avgRating,
        byDistrict,
        typeMix,
        mostViewed,
        viewsByDay,
        viewsLast7,
        weekDelta,
      },
    });
  } catch (e) {
    console.error("GET /api/insights", e);
    return NextResponse.json({ error: "Failed to load insights" }, { status: 500 });
  }
}

/** 14 local-day buckets ending today, e.g. "Sep 5". */
function dayBucketKeys(n: number): { key: string; label: string }[] {
  const keys: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push({
      key: d.toDateString(),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  return keys;
}

// cache-bust: recompile after prisma client regen
