import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BUSINESS } from "@/lib/business";

export const dynamic = "force-dynamic";

/**
 * Public site settings — safe subset only (no secrets).
 * Values fall back to the official business constants.
 */
export async function GET() {
  try {
    const rows = await db.setting.findMany({
      where: { key: { in: ["whatsapp_number", "whatsapp_number_2", "office_address", "business_email", "office_hours"] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const webhook = await db.setting.findUnique({ where: { key: "webhook_url" } });
    // Society block maps uploaded from the admin panel — slug → serve path.
    const mapRows = await db.setting.findMany({
      where: { key: { startsWith: "area_map_" } },
    });
    const areaMaps: Record<string, string> = {};
    for (const row of mapRows) {
      if (row.value) areaMaps[row.key.slice("area_map_".length)] = row.value;
    }
    return NextResponse.json({
      settings: {
        whatsappNumber: map.whatsapp_number || BUSINESS.whatsappNumber,
        whatsappNumber2: map.whatsapp_number_2 || BUSINESS.whatsappNumber2,
        address: map.office_address || BUSINESS.officeAddress,
        email: map.business_email || BUSINESS.email,
        hours: map.office_hours || BUSINESS.hours,
        webhookConfigured: Boolean(webhook?.value),
      },
      areaMaps,
    });
  } catch (e) {
    console.error("GET /api/settings", e);
    return NextResponse.json({
      settings: {
        whatsappNumber: BUSINESS.whatsappNumber,
        whatsappNumber2: BUSINESS.whatsappNumber2,
        address: BUSINESS.officeAddress,
        email: BUSINESS.email,
        hours: BUSINESS.hours,
        webhookConfigured: false,
      },
      areaMaps: {},
    });
  }
}
