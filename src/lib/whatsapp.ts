/**
 * Server-side WhatsApp plumbing for leads.
 *
 * Delivery strategy (no official WhatsApp API required):
 *  1. Every lead is saved to the database (admin panel inbox).
 *  2. If a webhook URL is configured in Settings, the lead is pushed out:
 *       - URL containing "{MESSAGE}" → GET with the placeholder substituted
 *         (works with CallMeBot-style bridges: your personal WhatsApp receives
 *          the message automatically — no official API needed).
 *       - any other URL → POST with a JSON payload (Make.com / n8n / Zapier /
 *         self-hosted gateways).
 *  3. The admin panel also offers one-tap wa.me deep links so the admin can
 *     answer any lead (or the customer) directly from the panel.
 */
import { db } from "./db";

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export function buildLeadMessage(lead: {
  name: string;
  phone: string;
  email?: string | null;
  category?: string | null;
  area?: string | null;
  budget?: number | null;
  message: string;
  source?: string;
  property?: { title: string } | null;
}): string {
  const lines = [
    "🏠 *New Property Lead — City Line Property*",
    "",
    `👤 Name: ${lead.name}`,
    `📞 Phone: ${lead.phone}`,
  ];
  if (lead.email) lines.push(`✉️ Email: ${lead.email}`);
  if (lead.category) lines.push(`🏷️ Interested in: ${lead.category.replace(/-/g, " ")}`);
  if (lead.area) lines.push(`📍 Area: ${lead.area}`);
  if (lead.budget) lines.push(`💰 Budget: PKR ${lead.budget.toLocaleString("en-PK")}`);
  if (lead.property?.title) lines.push(`🏘️ Property: ${lead.property.title}`);
  lines.push("", `💬 Message: ${lead.message}`);
  if (lead.source) lines.push("", `_Source: ${lead.source}_`);
  return lines.join("\n");
}

export type WaDelivery = "SENT" | "FAILED" | "SKIPPED";

/** Push a lead to the configured webhook (fire-and-forget friendly). */
export async function dispatchLeadWebhook(leadId: string): Promise<WaDelivery> {
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: { property: { select: { title: true } } },
  });
  if (!lead) return "SKIPPED";

  const url = await getSetting("webhook_url");
  if (!url) {
    await db.lead.update({ where: { id: leadId }, data: { waStatus: "SKIPPED" } });
    return "SKIPPED";
  }

  const message = buildLeadMessage(lead);
  const payload = {
    type: "lead",
    timestamp: new Date().toISOString(),
    message,
    lead: {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      category: lead.category,
      area: lead.area,
      budget: lead.budget,
      message: lead.message,
      source: lead.source,
      status: lead.status,
      property: lead.property?.title ?? null,
    },
  };

  try {
    let ok = false;
    let statusNote = "";
    if (url.includes("{MESSAGE}")) {
      // CallMeBot / wa-gateway style GET template
      const target = url.replaceAll("{MESSAGE}", encodeURIComponent(message));
      const res = await fetch(target, { method: "GET", signal: AbortSignal.timeout(10_000) });
      ok = res.ok;
      statusNote = `HTTP ${res.status}`;
    } else {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });
      ok = res.ok;
      statusNote = `HTTP ${res.status}`;
    }
    await db.lead.update({
      where: { id: leadId },
      data: ok
        ? { waStatus: "SENT", waSentAt: new Date(), waError: null }
        : { waStatus: "FAILED", waError: `Webhook responded ${statusNote}` },
    });
    return ok ? "SENT" : "FAILED";
  } catch (err) {
    await db.lead.update({
      where: { id: leadId },
      data: { waStatus: "FAILED", waError: err instanceof Error ? err.message : "Webhook error" },
    });
    return "FAILED";
  }
}
