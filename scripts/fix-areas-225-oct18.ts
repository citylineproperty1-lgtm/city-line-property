/**
 * Task 116 — Normalize area to City Line standard: 1 Marla = 225 sqft.
 *
 * Owner: "5 marla house so according to this 1125 sqft, 1 marla is 225 sqft".
 * Old seed data used the Punjab "big marla" (272.25 sqft). CLP-117 already used 225.
 *
 * Only marla-titled listings are converted. Apartments / studio / commercial hall
 * (CLP-110, 111, 112, 116) are covered-area values — untouched.
 * Run: env -u DATABASE_URL -u DIRECT_URL bun scripts/fix-areas-225-oct18.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** [reference, expected current area, correct area (marla × 225)] */
const FIXES: Array<[string, number, number]> = [
  ["CLP-101", 1361, 1125], // 5 Marla plot
  ["CLP-102", 817, 675], // 3 Marla plot
  ["CLP-103", 2722, 2250], // 10 Marla plot
  ["CLP-104", 5445, 4500], // 1 Kanal = 20 Marla
  ["CLP-105", 1089, 900], // 4 Marla commercial
  ["CLP-106", 681, 563], // 2.5 Marla commercial (562.5 → 563)
  ["CLP-107", 2100, 1125], // 5 Marla house
  ["CLP-108", 4200, 2250], // 10 Marla house
  ["CLP-109", 1250, 675], // 3 Marla house
  ["CLP-114", 1800, 1125], // 5 Marla house on rent
  ["CLP-118", 1800, 1125], // 5 Marla house (rooftop BBQ)
  ["CLP-119", 1800, 1125], // 5 Marla house (2 kitchen)
];

async function main() {
  let changed = 0;
  for (const [ref, expectOld, correct] of FIXES) {
    const row = await db.property.findFirst({ where: { reference: ref } });
    if (!row) {
      console.log(`✗ ${ref} — not found, skipped`);
      continue;
    }
    if (row.area !== expectOld) {
      console.log(`⚠ ${ref} — area is ${row.area}, expected ${expectOld} — skipped (needs manual look)`);
      continue;
    }
    await db.property.update({ where: { id: row.id }, data: { area: correct } });
    console.log(`✓ ${ref} ${row.area} → ${correct} sqft (${(correct / 225).toFixed(2)} marla)`);
    changed++;
  }
  console.log(`\n${changed}/${FIXES.length} listings updated.`);

  // Final audit — every listing against the 225 standard
  const all = await db.property.findMany({
    select: { reference: true, title: true, area: true },
    orderBy: { reference: "asc" },
  });
  console.log("\n--- Final audit ---");
  for (const p of all) {
    console.log(`${p.reference} | ${p.area} sqft | ${(p.area / 225).toFixed(2)} marla | ${p.title}`);
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
