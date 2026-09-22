import { PrismaClient } from '@prisma/client'
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DB_SNAPSHOT_BASE64 } from "./db-snapshot";

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

const TMP_DB = () => path.join(os.tmpdir(), "clp-custom.db");

/**
 * Deployment fallback chain (a real DATABASE_URL always wins):
 *  1. db/custom.db found on disk → use it directly (dev / standalone / VPS).
 *  2. Found but directory READ-ONLY (Vercel /var/task) → copy to /tmp.
 *  3. File missing entirely (host didn't trace it into the lambda) →
 *     decode the EMBEDDED db snapshot (db-snapshot.ts) to /tmp.
 * This guarantees every deployment from GitHub has full listing data.
 */
if (!process.env.DATABASE_URL) {
  const resolved = resolveDbFile();
  let target = "";

  if (fs.existsSync(resolved)) {
    try {
      fs.accessSync(path.dirname(resolved), fs.constants.W_OK);
      target = resolved;
    } catch {
      try {
        fs.copyFileSync(resolved, TMP_DB());
        target = TMP_DB();
      } catch {
        /* fall through to embedded snapshot */
      }
    }
  }

  if (!target) {
    try {
      fs.writeFileSync(TMP_DB(), Buffer.from(DB_SNAPSHOT_BASE64, "base64"));
      target = TMP_DB();
    } catch {
      /* keep original path — Prisma will surface its own clear error */
    }
  }

  process.env.DATABASE_URL = `file:${target || resolved}`;
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
