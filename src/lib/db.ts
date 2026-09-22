import { PrismaClient } from '@prisma/client'

// Bump when the Prisma schema changes so dev servers holding a stale cached
// client (missing new models) re-instantiate instead of serving `undefined`.
const SCHEMA_STAMP = 'v5-postgres'

// Data layer: Supabase Postgres (single source of truth).
// The DATABASE_URL connection string (transaction pooler, port 6543 +
// pgbouncer) is configured in Vercel → Settings → Environment Variables.
// The legacy SQLite fallback chain and embedded snapshot were retired when
// the project migrated to Postgres (see scripts/migrate-to-postgres.ts).
if (!process.env.DATABASE_URL) {
  console.error(
    '[db] DATABASE_URL is not set — API routes will fail until the ' +
      'Supabase connection string is added to the environment variables.',
  )
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
