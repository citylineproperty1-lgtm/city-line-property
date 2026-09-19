import { PrismaClient } from '@prisma/client'
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Bump when the Prisma schema changes so dev servers holding a stale cached
// client (missing new models) re-instantiate instead of serving `undefined`.
const SCHEMA_STAMP = 'v4-digest'

/**
 * Locate the committed SQLite database (db/custom.db) by walking up from
 * process.cwd() — works in dev (project root), in the .next/standalone
 * bundle, and on hosted platforms where the traced file lands elsewhere.
 */
function resolveDbFile(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, "db", "custom.db");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.join(process.cwd(), "db", "custom.db");
}

/**
 * Deployment fallbacks, in order:
 *  1. A real DATABASE_URL (env / .env) always wins.
 *  2. Otherwise point Prisma at the committed db/custom.db.
 *  3. If the file's directory is READ-ONLY (hosted lambdas like Vercel ship
 *     /var/task read-only — SQLite cannot open there), copy the database to
 *     /tmp and use that copy: reads are identical, writes live for the
 *     serverless instance instead of failing every request.
 */
if (!process.env.DATABASE_URL) {
  const resolved = resolveDbFile();
  let target = resolved;
  try {
    fs.accessSync(path.dirname(resolved), fs.constants.W_OK);
  } catch {
    try {
      const tmpDb = path.join(os.tmpdir(), "clp-custom.db");
      fs.copyFileSync(resolved, tmpDb);
      target = tmpDb;
    } catch {
      /* keep original path — Prisma will surface its own clear error */
    }
  }
  process.env.DATABASE_URL = `file:${target}`;
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
