import { db } from "@/lib/db";

/**
 * Lead CRM activity log — append-only JSON column on Lead (`activities`).
 * Entries: { at: ISO, type: "status"|"note"|"followup"|"contacted"|"whatsapp"|"visit", detail: string }
 * Rendered as a timeline in the lead card so the whole history of a lead is
 * visible at a glance.
 */

export interface LeadActivity {
  at: string;
  type: string;
  detail: string;
}

export async function appendLeadActivity(
  leadId: string,
  entry: { type: string; detail: string }
): Promise<LeadActivity[]> {
  try {
    const row = await db.lead.findUnique({ where: { id: leadId }, select: { activities: true } });
    let list: LeadActivity[] = [];
    try {
      list = row ? (JSON.parse(row.activities || "[]") as LeadActivity[]) : [];
    } catch {
      list = [];
    }
    list.push({ at: new Date().toISOString(), type: entry.type, detail: entry.detail });
    // keep the log bounded — the timeline shows the latest entries
    const trimmed = list.slice(-50);
    await db.lead.update({ where: { id: leadId }, data: { activities: JSON.stringify(trimmed) } });
    return trimmed;
  } catch (e) {
    // activity logging must never break the main operation
    console.error("appendLeadActivity", e);
    return [];
  }
}

export function parseActivities(raw: string | null | undefined, limit = 30): LeadActivity[] {
  try {
    const list = raw ? (JSON.parse(raw) as LeadActivity[]) : [];
    return Array.isArray(list) ? list.slice(-limit) : [];
  } catch {
    return [];
  }
}
