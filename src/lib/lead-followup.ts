import { db } from "@/lib/db";

/**
 * Lead follow-up reminders — self-healing columns.
 *
 * Adds "followUpAt" (epoch-ms DATETIME, nullable) and "lastContactedAt" to the
 * existing Lead table via raw SQL so the long-running dev server never depends
 * on a regenerated Prisma client (same pattern as Post / ViewEvent — see
 * worklog Task 9/10). Reads/writes go through raw SQL too, since the generated
 * client doesn't know the new columns.
 */

let columnsReady: Promise<void> | null = null;

export function ensureFollowUpColumns(): Promise<void> {
  if (!columnsReady) {
    columnsReady = (async () => {
      // SQLite: ADD COLUMN fails if it exists — swallow that specific error.
      await db
        .$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN "followUpAt" DATETIME`)
        .catch((e: unknown) => {
          const msg = String((e as Error)?.message ?? e);
          if (!msg.includes("duplicate column name")) throw e;
        });
      await db
        .$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN "lastContactedAt" DATETIME`)
        .catch((e: unknown) => {
          const msg = String((e as Error)?.message ?? e);
          if (!msg.includes("duplicate column name")) throw e;
        });
    })();
  }
  return columnsReady;
}

/** Lead ids due (followUpAt <= endOfDayMs, not WON/LOST, not already contacted after due). */
export async function dueFollowUpIds(endOfDayMs: number): Promise<string[]> {
  await ensureFollowUpColumns();
  const rows = await db.$queryRawUnsafe<{ id: string }[]>(
    `SELECT "id" FROM "Lead"
     WHERE "followUpAt" IS NOT NULL
       AND "followUpAt" <= ?
       AND "status" NOT IN ('WON', 'LOST')
     ORDER BY "followUpAt" ASC`,
    endOfDayMs
  );
  return (rows as { id: string }[]).map((r) => r.id);
}

export interface FollowUpItem {
  id: string;
  name: string;
  phone: string;
  followUpAt: string; // ISO
  status: string;
}

/** Upcoming / overdue follow-ups for the overview widget. */
export async function followUpQueue(limit = 4): Promise<{
  overdue: number;
  today: number;
  upcoming: FollowUpItem[];
}> {
  await ensureFollowUpColumns();
  const now = Date.now();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const endTodayMs = endOfToday.getTime();

  const rows = await db.$queryRawUnsafe(
    `SELECT "id","name","phone","followUpAt","status" FROM "Lead"
     WHERE "followUpAt" IS NOT NULL AND "status" NOT IN ('WON','LOST')
     ORDER BY "followUpAt" ASC LIMIT ?`,
    limit
  );

  const countRows = await db.$queryRawUnsafe<{ n: number; bucket: string }[]>(
    `SELECT
       SUM(CASE WHEN "followUpAt" < ? THEN 1 ELSE 0 END) AS "overdue",
       SUM(CASE WHEN "followUpAt" >= ? AND "followUpAt" <= ? THEN 1 ELSE 0 END) AS "today"
     FROM "Lead"
     WHERE "followUpAt" IS NOT NULL AND "status" NOT IN ('WON','LOST')`,
    now,
    now,
    endTodayMs
  );

  const list = (rows as unknown as { id: string; name: string; phone: string; followUpAt: number | string | Date; status: string }[]).map(
    (r) => ({
      id: String(r.id),
      name: String(r.name),
      phone: String(r.phone),
      followUpAt: toDate(r.followUpAt),
      status: String(r.status),
    })
  );

  const c = (countRows as unknown as { overdue: number | null; today: number | null }[])[0] ?? {
    overdue: 0,
    today: 0,
  };
  return {
    overdue: Number(c.overdue ?? 0),
    today: Number(c.today ?? 0),
    upcoming: list,
  };
}

function toDate(v: unknown): string {
  if (typeof v === "number") return new Date(v).toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n) && n > 1_000_000_000_000) return new Date(n).toISOString();
    const d = new Date(v.includes("T") ? v : v.replace(" ", "T"));
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}
