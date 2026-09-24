/**
 * One-off migration: Property.parking Int → Text ("Available" style).
 * The admin no longer stores a car count — parking is written manually,
 * e.g. "Available". Existing numbers > 0 become "Available"; 0 becomes "".
 *
 * Run: (unset DATABASE_URL DIRECT_URL; bun run scripts/parking-text-migrate.ts)
 * (unsetting avoids stale shell env overriding .env — known trap)
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const before = await db.$queryRaw<{ data_type: string; column_default: string | null; is_nullable: string }[]>`
    SELECT data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'Property' AND column_name = 'parking'`;
  console.log("before:", before);

  if (before[0]?.data_type === "text") {
    console.log("parking is already text — nothing to do.");
  } else {
    // DROP DEFAULT is a silent no-op when the column has no default.
    await db.$executeRawUnsafe(`ALTER TABLE "Property" ALTER COLUMN "parking" DROP DEFAULT`);
    await db.$executeRawUnsafe(
      `ALTER TABLE "Property" ALTER COLUMN "parking" TYPE TEXT USING (CASE WHEN "parking" > 0 THEN 'Available' ELSE '' END)`
    );
    await db.$executeRawUnsafe(`ALTER TABLE "Property" ALTER COLUMN "parking" SET DEFAULT ''`);
    await db.$executeRawUnsafe(`ALTER TABLE "Property" ALTER COLUMN "parking" SET NOT NULL`);
    console.log("Altered parking → text (numbers > 0 became 'Available').");
  }

  const after = await db.$queryRaw<{ reference: string; parking: string }[]>`
    SELECT reference, parking FROM "Property" ORDER BY "createdAt" DESC LIMIT 20`;
  console.log("rows after:", after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
