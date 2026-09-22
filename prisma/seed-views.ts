// One-off demo seed: spreads realistic ViewEvents over the past 14 days
// so the insights traffic chart has history on first load.
// Run: bun run prisma/seed-views.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const props = await db.property.findMany({ select: { id: true } });
  if (props.length === 0) {
    console.log("No properties — nothing to seed");
    return;
  }

  await db.viewEvent.deleteMany();

  const data: { propertyId: string; createdAt: Date }[] = [];
  for (let day = 13; day >= 0; day--) {
    // gentle upward trend: ~4 events 13 days ago → ~15 today, plus noise
    const base = Math.round(4 + (13 - day) * 0.85);
    const jitter = Math.floor(Math.random() * 3);
    for (let i = 0; i < base + jitter; i++) {
      const d = new Date();
      d.setDate(d.getDate() - day);
      d.setHours(8 + Math.floor(Math.random() * 13), Math.floor(Math.random() * 60), 0, 0);
      data.push({
        propertyId: props[Math.floor(Math.random() * props.length)].id,
        createdAt: d,
      });
    }
  }

  await db.viewEvent.createMany({ data });
  console.log(`Seeded ${data.length} view events across 14 days`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
