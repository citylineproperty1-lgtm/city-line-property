import { db } from "@/lib/db";

/**
 * Lead follow-up reminders.
 *
 * The followUpAt / lastContactedAt columns are part of the Prisma schema now,
 * so every read/write goes through the generated client — 100% portable
 * across SQLite (dev / standalone) and Postgres (Supabase).
 *
 * ensureFollowUpColumns() remains as a belt-and-braces no-op for databases
 * created before these columns existed: the ALTER runs once and the
 * "column already exists" error from either dialect is swallowed.
 */

let columnsReady: Promise<void> | null = null;

export function ensureFollowUpColumns(): Promise<void> {
  if (!columnsReady) {
    columnsReady = (async () => {
      const dupErr = (e: unknown) => {
        const msg = String((e as Error)?.message ?? e);
        return (
          msg.includes("duplicate column name") || // SQLite
          msg.includes("already exists") // Postgres
        );
      };
      await db
        .$executeRawUnsafe(
          `ALTER TABLE "Lead" ADD COLUMN "followUpAt" TIMESTAMP(3)`
        )
        .catch((e: unknown) => {
          if (!dupErr(e)) throw e;
        });
      await db
        .$executeRawUnsafe(
          `ALTER TABLE "Lead" ADD COLUMN "lastContactedAt" TIMESTAMP(3)`
        )
        .catch((e: unknown) => {
          if (!dupErr(e)) throw e;
        });
    })();
  }
  return columnsReady;
}

/** Lead ids due (followUpAt <= endOfDay, not WON/LOST). */
export async function dueFollowUpIds(endOfDayMs: number): Promise<string[]> {
  const rows = await db.lead.findMany({
    where: {
      followUpAt: { not: null, lte: new Date(endOfDayMs) },
      status: { notIn: ["WON", "LOST"] },
    },
    select: { id: true },
    orderBy: { followUpAt: "asc" },
  });
  return rows.map((r) => r.id);
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
  const now = Date.now();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const rows = await db.lead.findMany({
    where: {
      followUpAt: { not: null },
      status: { notIn: ["WON", "LOST"] },
    },
    select: { id: true, name: true, phone: true, followUpAt: true, status: true },
    orderBy: { followUpAt: "asc" },
    take: limit,
  });

  // Buckets computed in JS — the whole pipeline is a handful of rows.
  const all = await db.lead.findMany({
    where: {
      followUpAt: { not: null },
      status: { notIn: ["WON", "LOST"] },
    },
    select: { followUpAt: true },
  });
  const overdue = all.filter((r) => r.followUpAt && r.followUpAt.getTime() < now).length;
  const today = all.filter(
    (r) => r.followUpAt && r.followUpAt.getTime() >= now && r.followUpAt.getTime() <= endOfToday.getTime()
  ).length;

  return {
    overdue,
    today,
    upcoming: rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      followUpAt: (r.followUpAt as Date).toISOString(),
      status: r.status,
    })),
  };
}
