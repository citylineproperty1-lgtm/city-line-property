/**
 * One-off migration: local SQLite (db/custom.db) → Supabase Postgres.
 * Reads with bun:sqlite (raw), writes with the generated Postgres Prisma client.
 * Run: bun scripts/migrate-to-postgres.ts
 */
import { PrismaClient } from "@prisma/client";
import { Database } from "bun:sqlite";

const sqlite = new Database("db/custom.db", { readonly: true });
const pg = new PrismaClient();

type Row = Record<string, any>;

const num = (v: any): number | null => (v === null || v === undefined ? null : Number(v));
const int = (v: any, d = 0): number => (v === null || v === undefined ? d : Math.round(Number(v)));
const str = (v: any): string | null => (v === null || v === undefined ? null : String(v));
const req = (v: any, d = ""): string => (v === null || v === undefined ? d : String(v));
const date = (v: any): Date | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return new Date(Number.isFinite(n) && n > 0 ? n : Date.now());
};
const dateReq = (v: any): Date => date(v) ?? new Date();

async function main() {
  const counts = (t: string) => sqlite.query(`SELECT COUNT(*) c FROM "${t}"`).get() as any;

  console.log("— SQLite source counts —");
  for (const t of ["Category", "Property", "Lead", "SiteVisit", "AdminUser", "Setting"]) {
    console.log(`  ${t}: ${counts(t).c}`);
  }

  // Wipe destination (FK-safe order)
  await pg.siteVisit.deleteMany();
  await pg.lead.deleteMany();
  await pg.property.deleteMany();
  await pg.category.deleteMany();
  await pg.adminUser.deleteMany();
  await pg.setting.deleteMany();

  // 1) Category
  for (const c of sqlite.query("SELECT * FROM Category").all() as Row[]) {
    await pg.category.create({
      data: {
        id: req(c.id), name: req(c.name), slug: req(c.slug),
        icon: req(c.icon, "Building2"), color: req(c.color, "#0F766E"),
        description: req(c.description, ""), sortOrder: int(c.sortOrder),
        createdAt: dateReq(c.createdAt),
      },
    });
  }

  // 2) Property
  for (const p of sqlite.query("SELECT * FROM Property").all() as Row[]) {
    await pg.property.create({
      data: {
        id: req(p.id), title: req(p.title), slug: req(p.slug), reference: req(p.reference),
        description: req(p.description), price: num(p.price) ?? 0, status: req(p.status, "SALE"),
        type: req(p.type), beds: int(p.beds), baths: int(p.baths), area: int(p.area),
        address: req(p.address), city: req(p.city, "Lahore"), district: req(p.district),
        images: req(p.images, "[]"), amenities: req(p.amenities, "[]"),
        featured: !!p.featured, listingState: req(p.listingState, "AVAILABLE"),
        published: p.published === null || p.published === undefined ? true : !!p.published,
        yearBuilt: int(p.yearBuilt), parking: int(p.parking), views: int(p.views),
        createdAt: dateReq(p.createdAt), updatedAt: dateReq(p.updatedAt),
      },
    });
  }

  // 3) Lead (FK propertyId)
  for (const l of sqlite.query("SELECT * FROM Lead").all() as Row[]) {
    const propertyId = str(l.propertyId);
    const known = propertyId
      ? !!(await pg.property.findUnique({ where: { id: propertyId }, select: { id: true } }))
      : false;
    await pg.lead.create({
      data: {
        id: req(l.id), name: req(l.name), phone: req(l.phone), email: str(l.email),
        category: str(l.category), area: str(l.area), budget: l.budget === null || l.budget === undefined ? null : int(l.budget),
        message: req(l.message), propertyId: known ? propertyId : null,
        source: req(l.source, "WEBSITE"), status: req(l.status, "NEW"), notes: str(l.notes),
        waStatus: req(l.waStatus, "PENDING"), waSentAt: date(l.waSentAt), waError: str(l.waError),
        followUpAt: date(l.followUpAt), lastContactedAt: date(l.lastContactedAt),
        activities: req(l.activities, "[]"),
        createdAt: dateReq(l.createdAt), updatedAt: dateReq(l.updatedAt),
      },
    });
  }

  // 4) SiteVisit (FK propertyId)
  for (const v of sqlite.query("SELECT * FROM SiteVisit").all() as Row[]) {
    const propertyId = str(v.propertyId);
    const known = propertyId
      ? !!(await pg.property.findUnique({ where: { id: propertyId }, select: { id: true } }))
      : false;
    await pg.siteVisit.create({
      data: {
        id: req(v.id), name: req(v.name), phone: req(v.phone),
        propertyId: known ? propertyId : null, area: str(v.area),
        scheduledAt: dateReq(v.scheduledAt), status: req(v.status, "PLANNED"),
        notes: str(v.notes), createdAt: dateReq(v.createdAt), updatedAt: dateReq(v.updatedAt),
      },
    });
  }

  // 5) AdminUser + 6) Setting
  for (const a of sqlite.query("SELECT * FROM AdminUser").all() as Row[]) {
    await pg.adminUser.create({
      data: {
        id: req(a.id), email: req(a.email), name: req(a.name, "Administrator"),
        passwordHash: req(a.passwordHash), createdAt: dateReq(a.createdAt),
      },
    });
  }
  for (const s of sqlite.query("SELECT * FROM Setting").all() as Row[]) {
    await pg.setting.create({
      data: { key: req(s.key), value: req(s.value), updatedAt: dateReq(s.updatedAt) },
    });
  }

  console.log("— Postgres destination counts —");
  console.log(`  Category:  ${await pg.category.count()}`);
  console.log(`  Property:  ${await pg.property.count()} (featured ${await pg.property.count({ where: { featured: true } })})`);
  console.log(`  Lead:      ${await pg.lead.count()}`);
  console.log(`  SiteVisit: ${await pg.siteVisit.count()}`);
  console.log(`  AdminUser: ${await pg.adminUser.count()}`);
  console.log(`  Setting:   ${await pg.setting.count()}`);
  const admin = await pg.adminUser.findFirst();
  console.log(`  Admin account: ${admin?.email ?? "NONE"}`);
}

main()
  .then(() => { console.log("MIGRATION_OK"); process.exit(0); })
  .catch((e) => { console.error("MIGRATION_FAILED:", e); process.exit(1); })
  .finally(() => pg.$disconnect());
