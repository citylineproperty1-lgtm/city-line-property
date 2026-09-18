import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";
import { setSetting, getSetting } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const ALLOWED = [
  "webhook_url",
  "whatsapp_number",
  "whatsapp_number_2",
  "office_address",
  "business_email",
  "office_hours",
];

/** Panel settings (webhook URL, WhatsApp numbers, office info). */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const rows = await db.setting.findMany({ where: { key: { in: ALLOWED } } });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return NextResponse.json({ settings: map });
  } catch (e) {
    console.error("GET /api/admin/settings", e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const updates: [string, string][] = [];
    for (const key of ALLOWED) {
      if (body[key] !== undefined) {
        updates.push([key, body[key].toString()]);
      }
    }
    for (const [key, value] of updates) {
      await setSetting(key, value);
    }
    const url = await getSetting("webhook_url");
    return NextResponse.json({ ok: true, saved: updates.length, webhookConfigured: Boolean(url) });
  } catch (e) {
    console.error("PUT /api/admin/settings", e);
    return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }
}
