/**
 * Task 115 — owner's second 5 Marla house listing (Oct 2026), 10 WhatsApp
 * photos. Photos go through the SAME pipeline as admin uploads and Task 113
 * (see src/app/api/admin/upload/route.ts): EXIF rotate → flatten → cap
 * 1920px → bake the 45° diagonal CLP watermark (v5, text-only) → JPEG q82 →
 * MediaFile row served from /api/media/<id>.
 *
 * Run: env -u DATABASE_URL -u DIRECT_URL bun scripts/add-listing-house2-oct16.ts
 */
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { WATERMARK_LOCKUP_BASE64 } from "../src/lib/watermark-lockup";

const db = new PrismaClient();

const MAX_WIDTH = 1920;
const lockupBuffer = Buffer.from(WATERMARK_LOCKUP_BASE64, "base64");

const OWNER_ORDER = [
  "WhatsApp Image 2026-10-16 at 12.20.42 PM (1).jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.42 PM.jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.43 PM (1).jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.43 PM (2).jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.43 PM.jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.44 PM (1).jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.44 PM (2).jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.44 PM.jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.45 PM (1).jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.45 PM (2).jpeg",
];

const TITLE = "5 Marla House for Sale | 4 Bedrooms, 5 Washrooms & 2 Kitchen";

const DESCRIPTION = `Looking for a spacious and well-designed 5 Marla house? An excellent opportunity to own a beautiful home featuring comfortable living spaces and a rooftop BBQ area.

Property Features:

• Plot Size: 5 Marla
• Bedrooms: 4 Master Bedrooms
• Washrooms: 5
• Kitchens: 2
• Ideal For: Family Living and Long-Term Investment

Enjoy comfortable family living with spacious master bedrooms, two kitchens.

Contact City Line Property for the demand price, location details, and site visit.

Your Trusted Real Estate Partner | Lahore Real Estate Experts`;

const AMENITIES = [
  "4 Bedrooms",
  "5 Washrooms",
  "2 Kitchens",
  "Rooftop BBQ Area",
  "Family Living & Investment",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function watermarkAndStore(
  filePath: string,
  cleanName: string
): Promise<string> {
  const raw = readFileSync(filePath);
  const base = sharp(raw, { failOn: "none" })
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize({ width: MAX_WIDTH, withoutEnlargement: true });
  const resized = await base.toBuffer();
  const meta = await sharp(resized).metadata();
  const w = meta.width ?? MAX_WIDTH;
  const h = meta.height ?? Math.round((meta.width ?? 1) * 1.0);

  // 45° diagonal center mark — same geometry as the upload route (v5).
  const lockupW = Math.min(
    1200,
    Math.max(220, Math.min(Math.round(w * 0.85), Math.round(h * 0.92)))
  );
  const lockup = await sharp(lockupBuffer)
    .resize({ width: lockupW })
    .png()
    .toBuffer();
  const lm = await sharp(lockup).metadata();
  const left = Math.round((w - lockupW) / 2);
  const top = Math.round((h - (lm.height ?? 1)) / 2);

  const out = await sharp(resized)
    .composite([{ input: lockup, left, top }])
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer();

  const row = await db.mediaFile.create({
    data: {
      filename: cleanName,
      mime: "image/jpeg",
      size: out.length,
      data: out.toString("base64"),
    },
    select: { id: true },
  });
  console.log(`  ✓ ${cleanName} → /api/media/${row.id} (${out.length} bytes)`);
  return `/api/media/${row.id}`;
}

async function main() {
  // ---- guard: never run twice for the same title ----
  const dupe = await db.property.findFirst({
    where: { title: TITLE },
    select: { reference: true },
  });
  if (dupe) throw new Error(`Listing already exists: ${dupe.reference}`);

  // ---- 1) watermarked photos ----
  const uploadDir = join(process.cwd(), "upload");
  const present = new Set(readdirSync(uploadDir));
  const images: string[] = [];
  let n = 0;
  for (const name of OWNER_ORDER) {
    if (!present.has(name)) {
      console.warn(`  ! missing upload file: ${name} — skipped`);
      continue;
    }
    n += 1;
    const clean = `5marla-house-4bed-${String(n).padStart(2, "0")}.jpg`;
    const path = await watermarkAndStore(join(uploadDir, name), clean);
    images.push(path);
  }
  if (images.length === 0) throw new Error("No photos processed");
  console.log(`Photos: ${images.length}/10 stored`);

  // ---- 2) reference = max + 1 (same rule as the admin POST route) ----
  const refs = await db.property.findMany({ select: { reference: true } });
  let maxRef = 100;
  for (const r of refs) {
    const m = /^CLP-(\d+)$/.exec(r.reference);
    if (m) maxRef = Math.max(maxRef, Number(m[1]));
  }
  const reference = `CLP-${maxRef + 1}`;
  const slug = `${slugify(TITLE)}-${Math.random().toString(36).slice(2, 6)}`;

  // ---- 3) the listing ----
  const row = await db.property.create({
    data: {
      title: TITLE,
      slug,
      reference,
      description: DESCRIPTION,
      price: 32_500_000, // 3 crore 25 lac
      status: "SALE",
      type: "houses",
      beds: 4,
      baths: 5,
      area: 1800,
      address: "Location on request",
      city: "Lahore",
      district: "Etihad Town Phase 1",
      images: JSON.stringify(images),
      amenities: JSON.stringify(AMENITIES),
      featured: false,
      published: true,
      listingState: "AVAILABLE",
      yearBuilt: 2026,
      parking: "",
    },
  });
  console.log(
    `Created ${row.reference} (id=${row.id}) slug=${row.slug} price=${row.price} images=${images.length}`
  );
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
