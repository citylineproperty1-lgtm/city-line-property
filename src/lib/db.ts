import { PrismaClient } from '@prisma/client'

// Bump when the Prisma schema changes so dev servers holding a stale cached
// client (missing new models) re-instantiate instead of serving `undefined`.
const SCHEMA_STAMP = 'v4-digest'

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
