/**
 * Task 120 — owner request: new listing, pair of residential plots facing a park.
 *   Title:  Pair Plots for Sale Facing Park | 6 Marla + 5.2 Marla Corner Plot
 *   Price:  13 crore (PKR 130,000,000)
 *   Area:   11.2 marla total (6 + 5.2) × 225 sqft/marla = 2520 sqft
 *   Photos: 4 (park-side plot x2 street views, 1 aerial corner, 1 park road)
 *
 * Photos go through the SAME pipeline as admin uploads and earlier tasks
 * (see src/app/api/admin/upload/route.ts): EXIF rotate → flatten → cap 1920px →
 * bake the 45° diagonal CLP watermark (v5 lockup) → JPEG q82 → MediaFile row
 * served from /api/media/<id>. Clean originals — watermark exactly once.
 *
 * Run: env -u DATABASE_URL -u DIRECT_URL bun scripts/add-listing-pairplots-oct18.ts
 */
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { WATERMARK_LOCKUP_BASE64 } from "../src/lib/watermark-lockup";

const db = new PrismaClient();

const MAX_WIDTH = 1920;
const lockupBuffer = Buffer.from(WATERMARK_LOCKUP_BASE64, "base64");

const TITLE =
  "Pair Plots for Sale Facing Park | 6 Marla + 5.2 Marla Corner Plot";

const DESCRIPTION = `Looking for a prime property investment opportunity? A pair of plots is available for sale, offering an attractive location facing a park, including one corner plot.

Property Details:

• Plot 1: 6 Marla
• Plot 2: 5.2 Marla
• Total Area: 11.2 Marla
• Location Feature: Park Facing
• Special Feature: One Corner Plot
• Property Type: Pair of Plots
• Status: Available for Sale

Why Consider These Plots?

• Park-facing location with an open outlook.
• One corner plot for buyers seeking a corner location.
• Two adjacent plots offered as a pair.
• Suitable for buyers looking to build or invest, subject to the society's rules and applicable approvals.

Whether you are planning future construction or looking for a property investment, these plots offer an opportunity worth exploring.

Contact City Line Property for the demand price, exact location, plot numbers, and site visit.

City Line Property — Your Trusted Real Estate Partner.`;

const AMENITIES = [
  "Park Facing",
  "One Corner Plot",
  "Two Adjacent Plots",
  "6 Marla + 5.2 Marla",
  "Open Outlook",
  "Prime Investment Opportunity",
];

// Owner's listed order: 2 street-level plot views, aerial corner shot, park road.
const OWNER_ORDER = [
  "pasted_image_1792497149172.png",
  "pasted_image_1792497158534.png",
  "pasted_image_1792497167622.png",
  "pasted_image_1792497182275.png",
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
    const clean = `pair-plots-park-${String(n).padStart(2, "0")}.jpg`;
    const path = await watermarkAndStore(join(uploadDir, name), clean);
    images.push(path);
  }
  if (images.length === 0) throw new Error("No photos processed");
  console.log(`Photos: ${images.length}/4 stored`);

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
      price: 130_000_000, // 13 crore
      status: "SALE",
      type: "residential-plots",
      beds: 0,
      baths: 0,
      area: 2520, // 11.2 marla × 225 sqft/marla
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
    `Created ${row.reference} (id=${row.id}) slug=${row.slug} price=${row.price} area=${row.area} images=${images.length}`
  );
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
