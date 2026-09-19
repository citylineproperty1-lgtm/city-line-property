import { PrismaClient } from '@prisma/client'
import fs from "node:fs";
import path from "node:path";

// Bump when the Prisma schema changes so dev servers holding a stale cached
// client (missing new models) re-instantiate instead of serving `undefined`.
const SCHEMA_STAMP = 'v4-digest'

/**
 * Deployment fallback: `.env` is gitignored, so builds deployed from GitHub
 * (Vercel / platform hosting) have no DATABASE_URL and Prisma would throw
 * "Environment variable not found" on every request — e.g. the admin login
 * 500s. Point Prisma at the committed SQLite database (db/custom.db).
 *
 * Resolution walks up from process.cwd() so it works in dev (project root),
 * in the standalone server bundle (.next/standalone — the build copies db/)
 * and on hosted platforms. A real DATABASE_URL always wins.
 */
if (!process.env.DATABASE_URL) {
  let dir = process.cwd();
  let found = "";
  for (let i = 0; i < 6 && !found; i++) {
    const candidate = path.join(dir, "db", "custom.db");
    if (fs.existsSync(candidate)) found = candidate;
    else {
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  process.env.DATABASE_URL = `file:${found || path.join(process.cwd(), "db", "custom.db")}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaStamp?: string
}

export const db =
  globalForPrisma.prisma && globalForPrisma.prismaStamp === SCHEMA_STAMP
    ? globalForPrisma.prisma
    : new PrismaClient()

globalForPrisma.prisma = db
globalForPrisma.prismaStamp = SCHEMA_STAMP
